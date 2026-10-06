"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Scale,
  Search,
  UploadCloud,
  FileText,
  BookOpen,
  ArrowUpDown,
  Download,
  Eye,
  Trash2,
  Plus,
  X,
  CheckCircle,
  FileCheck,
  Calendar,
  Layers,
  Shield,
  File,
  Sparkles,
  RefreshCw,
  FolderOpen,
  ExternalLink,
} from "lucide-react";
import { ActsService } from "@/services/actsService";
import { LegalActItem, LegalSectionItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ActsAndSectionsPage() {
  const [actsList, setActsList] = useState<LegalActItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"A_TO_Z" | "Z_TO_A" | "YEAR_DESC" | "SECTIONS_DESC">("A_TO_Z");

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadShortName, setUploadShortName] = useState("");
  const [uploadActNumber, setUploadActNumber] = useState("");
  const [uploadEnactmentDate, setUploadEnactmentDate] = useState("");
  const [uploadCategory, setUploadCategory] = useState<LegalActItem["category"]>("SPECIAL_ACT");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTotalSections, setUploadTotalSections] = useState<number>(0);
  const [uploadKeySectionsText, setUploadKeySectionsText] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileSize, setUploadFileSize] = useState("");
  const [uploadFileFormat, setUploadFileFormat] = useState<LegalActItem["fileFormat"]>("PDF");
  const [uploadFileDataUrl, setUploadFileDataUrl] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);

  // Act Preview / Bare Act Detail Modal
  const [activeActModal, setActiveActModal] = useState<LegalActItem | null>(null);
  const [sectionFilterQuery, setSectionFilterQuery] = useState("");

  // Load Acts from service (includes built-in Bare Acts + custom localStorage uploads)
  const loadActs = () => {
    const list = ActsService.getAllActs();
    setActsList(list);
  };

  useEffect(() => {
    loadActs();
  }, []);

  // Handle Search Submission
  const handleTriggerSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveSearchQuery(searchInput.trim().toLowerCase());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearchQuery("");
  };

  // File change handler for custom uploads (Any Format: PDF, DOCX, TXT, etc.)
  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    setUploadFileSize(Number(sizeInMb) < 0.1 ? `${(file.size / 1024).toFixed(1)} KB` : `${sizeInMb} MB`);

    const lowerName = file.name.toLowerCase();
    if (file.type.includes("pdf") || lowerName.endsWith(".pdf")) {
      setUploadFileFormat("PDF");
    } else if (file.type.includes("word") || lowerName.endsWith(".docx") || lowerName.endsWith(".doc")) {
      setUploadFileFormat("DOCX");
    } else if (file.type.startsWith("image/") || lowerName.endsWith(".jpg") || lowerName.endsWith(".png")) {
      setUploadFileFormat("IMAGE");
    } else if (file.type.includes("text") || lowerName.endsWith(".txt")) {
      setUploadFileFormat("TXT");
    } else {
      setUploadFileFormat("OTHER");
    }

    if (!uploadTitle.trim()) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadFileDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit new custom document / Act
  const handleAddDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      alert("Please provide the Document or Act Title.");
      return;
    }

    setIsUploading(true);
    try {
      // Parse optional key sections from text
      const parsedKeySections: LegalSectionItem[] = [];
      if (uploadKeySectionsText.trim()) {
        const lines = uploadKeySectionsText.split("\n").filter((l) => l.trim().length > 0);
        lines.forEach((line) => {
          const parts = line.split(":");
          if (parts.length >= 2) {
            parsedKeySections.push({
              sectionNumber: parts[0].trim(),
              title: parts.slice(1).join(":").trim(),
              description: parts.slice(1).join(":").trim(),
            });
          } else {
            parsedKeySections.push({
              sectionNumber: "Sec",
              title: line.trim(),
              description: line.trim(),
            });
          }
        });
      }

      const categoryLabels: Record<LegalActItem["category"], string> = {
        CRIMINAL_CODE: "Substantive Criminal Law",
        PROCEDURAL_CODE: "Criminal Procedure Code",
        EVIDENCE_CODE: "Law of Evidence",
        SPECIAL_ACT: "Special & Local Law",
        ECONOMIC_PROPERTY: "Economic & Property Law",
        POLICE_RULES: "Police Rules & Manuals",
        OTHER: "Legal Document / Circular",
      };

      const newAct = ActsService.addCustomAct({
        title: uploadTitle.trim(),
        shortName: uploadShortName.trim() || uploadTitle.trim().slice(0, 20),
        actNumber: uploadActNumber.trim() || `Uploaded ${new Date().toLocaleDateString("en-IN")}`,
        enactmentDate: uploadEnactmentDate.trim() || new Date().toLocaleDateString("en-IN"),
        effectiveDate: "In Force",
        category: uploadCategory,
        categoryLabel: categoryLabels[uploadCategory] || "Legal Reference",
        totalSections: uploadTotalSections || (parsedKeySections.length > 0 ? parsedKeySections.length : 1),
        totalChapters: 1,
        fileFormat: uploadFileFormat,
        fileName: uploadFileName || `${uploadTitle.replace(/\s+/g, "_")}.${uploadFileFormat.toLowerCase()}`,
        fileSize: uploadFileSize || "Uploaded",
        fileDataUrl: uploadFileDataUrl,
        description: uploadDescription.trim() || "Uploaded legal bare act / section document.",
        keySections: parsedKeySections,
      });

      loadActs();
      setUploadModalOpen(false);

      // Reset form
      setUploadTitle("");
      setUploadShortName("");
      setUploadActNumber("");
      setUploadEnactmentDate("");
      setUploadCategory("SPECIAL_ACT");
      setUploadDescription("");
      setUploadTotalSections(0);
      setUploadKeySectionsText("");
      setUploadFileName("");
      setUploadFileSize("");
      setUploadFileDataUrl(undefined);
      alert(`"${newAct.title}" has been saved permanently to your Legal Acts repository!`);
    } catch (err: any) {
      alert(err.message || "Failed to save document");
    } finally {
      setIsUploading(false);
    }
  };

  // Delete custom document
  const handleDeleteCustomAct = (actId: string, actTitle: string) => {
    if (confirm(`Are you sure you want to remove "${actTitle}" from the legal repository?`)) {
      ActsService.deleteCustomAct(actId);
      loadActs();
    }
  };

  // Filtered & Sorted Acts List
  const filteredAndSortedActs = useMemo(() => {
    let result = [...actsList];

    // 1. Filter by category
    if (selectedCategory !== "ALL") {
      result = result.filter((a) => a.category === selectedCategory);
    }

    // 2. Filter by search query (Act title, act number, description, or sections)
    if (activeSearchQuery) {
      const q = activeSearchQuery;
      result = result.filter((act) => {
        const matchesAct =
          act.title.toLowerCase().includes(q) ||
          act.shortName.toLowerCase().includes(q) ||
          act.actNumber.toLowerCase().includes(q) ||
          act.description.toLowerCase().includes(q) ||
          act.categoryLabel.toLowerCase().includes(q);

        const matchesSection = act.keySections.some(
          (s) =>
            s.sectionNumber.toLowerCase().includes(q) ||
            s.title.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            (s.punishment && s.punishment.toLowerCase().includes(q))
        );

        const matchesChapter = (act.chapters || []).some(
          (c) => c.title.toLowerCase().includes(q) || c.chapterNumber.toLowerCase().includes(q)
        );

        return matchesAct || matchesSection || matchesChapter;
      });
    }

    // 3. Sort alphabetically (A-Z) or other criteria
    result.sort((a, b) => {
      if (sortOrder === "A_TO_Z") {
        return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      } else if (sortOrder === "Z_TO_A") {
        return b.title.localeCompare(a.title, undefined, { sensitivity: "base" });
      } else if (sortOrder === "SECTIONS_DESC") {
        return b.totalSections - a.totalSections;
      } else if (sortOrder === "YEAR_DESC") {
        const getYear = (str: string) => {
          const match = str.match(/\b(19\d\d|20\d\d)\b/);
          return match ? parseInt(match[0], 10) : 0;
        };
        return getYear(b.title) - getYear(a.title);
      }
      return 0;
    });

    return result;
  }, [actsList, activeSearchQuery, selectedCategory, sortOrder]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#0b192c] via-[#10243e] to-[#0b192c] border-b-4 border-amber-500 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Statutory Bare Acts &amp; Criminal Law Database</span>
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                CMS Repository
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>ACT and SECTIONs</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Official Indian Legal Bare Acts, Criminal Law Codes (BNS 2023, BNSS 2023, BSA 2023, Arms Act 1959, Benami Property Act 1988) and statutory police powers. Upload documents in any format with permanent local storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={() => setUploadModalOpen(true)}
              variant="primary"
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs gap-2 px-4 py-2.5 shadow-md cursor-pointer transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document (Any Format)</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60 text-xs">
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 text-[11px]">Total Acts Available</div>
            <div className="text-base sm:text-lg font-bold text-white mt-0.5">{actsList.length} Acts</div>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 text-[11px]">Substantive Criminal Law</div>
            <div className="text-base sm:text-lg font-bold text-amber-300 mt-0.5">BNS 2023 (358 Sec)</div>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 text-[11px]">Procedural Code &amp; Forms</div>
            <div className="text-base sm:text-lg font-bold text-blue-300 mt-0.5">BNSS 2023 (531 Sec)</div>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 text-[11px]">Special Laws Included</div>
            <div className="text-base sm:text-lg font-bold text-emerald-300 mt-0.5">Arms &amp; Benami Acts</div>
          </div>
        </div>
      </div>

      {/* Search Bar & Filters Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
        <form onSubmit={handleTriggerSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Act name, Section number (e.g. 103, 173, 25, 3), offence, or keyword..."
              className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-8 py-2.5 text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                title="Clear Search"
              >
                &times;
              </button>
            )}
          </div>

          {/* Explicit Search Button (user specifically requested "search ka button ho") */}
          <Button
            type="submit"
            variant="primary"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 px-5 py-2.5 shrink-0 shadow-xs cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </Button>

          {/* Alphabetical Sort Dropdown (user specifically requested "sort ho alphabatically") */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-500 text-xs font-medium hidden md:inline">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2.5 text-slate-800 bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
            >
              <option value="A_TO_Z">Alphabetical (A to Z)</option>
              <option value="Z_TO_A">Alphabetical (Z to A)</option>
              <option value="YEAR_DESC">Year (Newest First)</option>
              <option value="SECTIONS_DESC">Most Sections</option>
            </select>
          </div>
        </form>

        {/* Categories Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Category:</span>
          {[
            { key: "ALL", label: `All Acts (${actsList.length})` },
            { key: "CRIMINAL_CODE", label: "BNS Criminal Code" },
            { key: "PROCEDURAL_CODE", label: "BNSS Procedure" },
            { key: "EVIDENCE_CODE", label: "BSA Evidence" },
            { key: "SPECIAL_ACT", label: "Arms & Special Acts" },
            { key: "ECONOMIC_PROPERTY", label: "Benami & Economic" },
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                selectedCategory === cat.key
                  ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search results active indicator */}
      {activeSearchQuery && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Searching for: <strong>&ldquo;{activeSearchQuery}&rdquo;</strong> &bull; Found <strong>{filteredAndSortedActs.length}</strong> matching acts
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-blue-700 hover:underline font-bold text-xs"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Main List Format of Acts (user requested: "jo bhi save ho vo list format me ho") */}
      <div className="space-y-4">
        {filteredAndSortedActs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">No matching acts or sections found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No results found for &ldquo;{activeSearchQuery}&rdquo;. Try adjusting your keywords or upload a new act document.
            </p>
            <Button size="sm" variant="outline" onClick={handleClearSearch} className="text-xs">
              View All Acts
            </Button>
          </div>
        ) : (
          filteredAndSortedActs.map((act, index) => {
            const formatBadgeColor =
              act.fileFormat === "PDF"
                ? "bg-red-50 text-red-700 border-red-200"
                : act.fileFormat === "DOCX"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-100 text-slate-700 border-slate-200";

            return (
              <Card
                key={act.id}
                className="border-slate-200 hover:border-blue-400 shadow-2xs hover:shadow-sm transition-all overflow-hidden bg-white group"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Row 1: Header & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          #{index + 1}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${formatBadgeColor}`}>
                          {act.fileFormat} Document
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {act.categoryLabel}
                        </span>
                        {act.isCustomUpload && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Custom Upload
                          </span>
                        )}
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {act.title}
                      </h2>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                        <span><strong>{act.actNumber}</strong></span>
                        <span>&bull; Enacted: {act.enactmentDate}</span>
                        <span>&bull; Effective: {act.effectiveDate}</span>
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-2 self-start shrink-0">
                      <div className="text-center px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Sections</span>
                        <span className="text-sm font-bold text-slate-800">{act.totalSections}</span>
                      </div>
                      <div className="text-center px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Chapters</span>
                        <span className="text-sm font-bold text-slate-800">{act.totalChapters}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Description */}
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {act.description}
                  </p>

                  {/* Row 3: Key Sections Preview Chips */}
                  {act.keySections && act.keySections.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Key Sections &amp; Provisions ({act.keySections.length}):</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {act.keySections.slice(0, 8).map((sec) => (
                          <button
                            key={sec.sectionNumber}
                            type="button"
                            onClick={() => {
                              setActiveActModal(act);
                              setSectionFilterQuery(sec.sectionNumber);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-800 transition-colors cursor-pointer text-left"
                            title={`${sec.title}: ${sec.description}`}
                          >
                            <span className="font-bold text-blue-700 font-mono">Sec {sec.sectionNumber}</span>
                            <span className="text-slate-500 truncate max-w-[140px]">{sec.title}</span>
                          </button>
                        ))}
                        {act.keySections.length > 8 && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveActModal(act);
                              setSectionFilterQuery("");
                            }}
                            className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            +{act.keySections.length - 8} More Sections...
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Row 4: Action Buttons (Preview, Sections, Download) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setActiveActModal(act);
                          setSectionFilterQuery("");
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Browse Sections ({act.totalSections})</span>
                      </Button>

                      {act.fileDataUrl && (
                        <a
                          href={act.fileDataUrl}
                          download={act.fileName || `${act.shortName}.pdf`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" />
                          <span>Download {act.fileFormat}</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {act.isCustomUpload && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomAct(act.id, act.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Uploaded Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: UPLOAD DOCUMENT / ACT IN ANY FORMAT                              */}
      {/* ========================================================================= */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => {
              if (!isUploading) setUploadModalOpen(false);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] flex flex-col z-10 animate-in fade-in-0 zoom-in-95 overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#081225] to-[#12284b] text-white flex items-center justify-between border-b border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider font-mono">
                  Repository Upload
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-amber-400" />
                  <span>Upload Act or Legal Document (Any Format)</span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Document will be saved permanently in the local repository and sorted alphabetically.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isUploading) setUploadModalOpen(false);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddDocumentSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* File Upload Zone First */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    <span>Upload File (PDF, DOCX, TXT, Images, etc.) *</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Any format allowed</span>
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 bg-white text-center transition-colors">
                  <input
                    type="file"
                    id="actDocumentFileInput"
                    onChange={handleFileUploadChange}
                    className="hidden"
                  />
                  <label htmlFor="actDocumentFileInput" className="cursor-pointer block space-y-1.5">
                    {uploadFileName ? (
                      <div className="flex items-center justify-between p-2 bg-blue-50/70 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 truncate pr-2 font-bold text-slate-900 text-xs">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[240px]">{uploadFileName}</span>
                          <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-mono uppercase">
                            {uploadFileFormat} &bull; {uploadFileSize}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setUploadFileName("");
                            setUploadFileSize("");
                            setUploadFileDataUrl(undefined);
                          }}
                          className="text-[11px] text-red-600 hover:underline font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 space-y-1">
                        <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="font-bold text-blue-600 hover:underline text-xs">
                          Click to select PDF or Document from device
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Supports PDF, Word (.doc/.docx), TXT, JPEG, PNG or scan files
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Title & Short Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Act / Document Full Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. The Motor Vehicles Act, 1988 / Haryana Police Rules"
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Short Name / Code</label>
                  <input
                    type="text"
                    value={uploadShortName}
                    onChange={(e) => setUploadShortName(e.target.value)}
                    placeholder="e.g. MV Act, 1988"
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Act Number & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Act / Gazette Number</label>
                  <input
                    type="text"
                    value={uploadActNumber}
                    onChange={(e) => setUploadActNumber(e.target.value)}
                    placeholder="e.g. Act No. 59 of 1988"
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Law Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white font-medium focus:border-blue-500 focus:outline-none"
                  >
                    <option value="SPECIAL_ACT">Special &amp; Local Law (Arms, Drugs, Traffic)</option>
                    <option value="CRIMINAL_CODE">Substantive Criminal Law (Penal Code)</option>
                    <option value="PROCEDURAL_CODE">Criminal Procedure Code</option>
                    <option value="EVIDENCE_CODE">Evidence Law</option>
                    <option value="ECONOMIC_PROPERTY">Economic &amp; Property Law</option>
                    <option value="POLICE_RULES">Police Rules &amp; Regulations</option>
                    <option value="OTHER">Government Notification / Circular</option>
                  </select>
                </div>
              </div>

              {/* Total Sections & Enactment Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Total Sections Count</label>
                  <input
                    type="number"
                    value={uploadTotalSections || ""}
                    onChange={(e) => setUploadTotalSections(Number(e.target.value))}
                    placeholder="e.g. 217"
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Enactment Date / Year</label>
                  <input
                    type="text"
                    value={uploadEnactmentDate}
                    onChange={(e) => setUploadEnactmentDate(e.target.value)}
                    placeholder="e.g. 14th October 1988"
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Description &amp; Scope</label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Summary of what offences or procedures this Act covers..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-blue-500 focus:outline-none font-sans"
                />
              </div>

              {/* Key Sections list */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Key Sections &amp; Headings (One per line: &ldquo;SectionNumber: Description&rdquo;)
                </label>
                <textarea
                  rows={3}
                  value={uploadKeySectionsText}
                  onChange={(e) => setUploadKeySectionsText(e.target.value)}
                  placeholder={`184: Driving dangerously\n185: Driving by drunken person\n194D: Penalty for violation of safety measures for motorcycle`}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-blue-500 focus:outline-none font-mono text-[11px]"
                />
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-xs"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Save into Legal Repository</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INTERACTIVE BARE ACT & SECTIONS EXPLORER                         */}
      {/* ========================================================================= */}
      {activeActModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveActModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full h-[90vh] flex flex-col z-10 animate-in fade-in-0 zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0b192c] to-[#12284b] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-mono">
                    {activeActModal.shortName}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">{activeActModal.actNumber}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {activeActModal.totalSections} Sections &bull; {activeActModal.totalChapters} Chapters
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-xl">
                  {activeActModal.title}
                </h3>
              </div>
              <button onClick={() => setActiveActModal(null)} className="p-1 rounded-md text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Search & Filter */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={sectionFilterQuery}
                  onChange={(e) => setSectionFilterQuery(e.target.value)}
                  placeholder="Filter sections by number (e.g. 103, 173) or keywords..."
                  className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-6 py-2 text-slate-900 bg-white focus:border-blue-600 focus:outline-none"
                />
                {sectionFilterQuery && (
                  <button
                    type="button"
                    onClick={() => setSectionFilterQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    &times;
                  </button>
                )}
              </div>

              {activeActModal.fileDataUrl && (
                <a
                  href={activeActModal.fileDataUrl}
                  download={activeActModal.fileName}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </a>
              )}
            </div>

            {/* Modal Scrollable Content: Chapters & Section List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Act Description & Overview */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1.5 text-xs">
                <div className="font-bold text-blue-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Statutory Overview</span>
                </div>
                <p className="text-blue-900 leading-relaxed font-sans">
                  {activeActModal.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-blue-800 font-mono pt-1">
                  <span>Enacted: <strong>{activeActModal.enactmentDate}</strong></span>
                  <span>&bull; In Force: <strong>{activeActModal.effectiveDate}</strong></span>
                </div>
              </div>

              {/* Arrangement of Chapters */}
              {activeActModal.chapters && activeActModal.chapters.length > 0 && !sectionFilterQuery && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0b192c] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Arrangement of Chapters ({activeActModal.chapters.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {activeActModal.chapters.map((ch) => (
                      <div
                        key={ch.chapterNumber}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <span className="font-bold text-slate-800 block truncate">{ch.chapterNumber}: {ch.title}</span>
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                          {ch.sectionsRange}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Sections List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0b192c] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sections &amp; Statutory Provisions</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Showing {
                      activeActModal.keySections.filter((s) => {
                        if (!sectionFilterQuery) return true;
                        const q = sectionFilterQuery.toLowerCase();
                        return (
                          s.sectionNumber.toLowerCase().includes(q) ||
                          s.title.toLowerCase().includes(q) ||
                          s.description.toLowerCase().includes(q)
                        );
                      }).length
                    } of {activeActModal.keySections.length} Sections
                  </span>
                </div>

                <div className="space-y-3">
                  {activeActModal.keySections
                    .filter((s) => {
                      if (!sectionFilterQuery) return true;
                      const q = sectionFilterQuery.toLowerCase();
                      return (
                        s.sectionNumber.toLowerCase().includes(q) ||
                        s.title.toLowerCase().includes(q) ||
                        s.description.toLowerCase().includes(q)
                      );
                    })
                    .map((sec) => (
                      <div
                        key={sec.sectionNumber}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 shadow-2xs space-y-2 text-xs"
                      >
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                              Section {sec.sectionNumber}
                            </span>
                            <h5 className="font-bold text-slate-900 text-sm">{sec.title}</h5>
                          </div>

                          {/* Classification badges if present */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                            {sec.cognizable && (
                              <span
                                className={`px-2 py-0.5 rounded-full border ${
                                  sec.cognizable === "Cognizable"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {sec.cognizable}
                              </span>
                            )}
                            {sec.bailable && (
                              <span
                                className={`px-2 py-0.5 rounded-full border ${
                                  sec.bailable === "Bailable"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                              >
                                {sec.bailable}
                              </span>
                            )}
                            {sec.triableBy && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {sec.triableBy}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Chapter indicator */}
                        {sec.chapter && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {sec.chapter}
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-slate-700 leading-relaxed font-sans">
                          {sec.description}
                        </p>

                        {/* Punishment line if available */}
                        {sec.punishment && (
                          <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-950 font-medium text-[11px] flex items-start gap-1.5">
                            <strong className="shrink-0 text-amber-900">Punishment:</strong>
                            <span>{sec.punishment}</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>Haryana Police Legal Reference &bull; {activeActModal.shortName}</span>
              <Button size="sm" variant="outline" onClick={() => setActiveActModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
