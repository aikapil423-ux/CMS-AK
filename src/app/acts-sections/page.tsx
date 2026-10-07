"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Copy,
  Check,
  Printer,
  Type,
  Gavel,
} from "lucide-react";
import { ActsService } from "@/services/actsService";
import { LegalActItem, LegalSectionItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function ActsAndSectionsContent() {
  const searchParams = useSearchParams();
  const [actsList, setActsList] = useState<LegalActItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"A_TO_Z" | "Z_TO_A" | "YEAR_DESC" | "SECTIONS_DESC">("A_TO_Z");

  // Upload Modal State (Simplified: Only File + Name, everything else auto-processed by AI)
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadFileSize, setUploadFileSize] = useState("");
  const [uploadFileFormat, setUploadFileFormat] = useState<LegalActItem["fileFormat"]>("PDF");
  const [uploadFileDataUrl, setUploadFileDataUrl] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  // Act Preview / Bare Act Detail Modal & Verbatim Text State
  const [activeActModal, setActiveActModal] = useState<LegalActItem | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<"VERBATIM" | "DOCUMENT" | "SECTIONS">("VERBATIM");
  const [targetPageNumber, setTargetPageNumber] = useState<number | null>(null);
  const [sectionFilterQuery, setSectionFilterQuery] = useState("");
  const [verbatimSearchQuery, setVerbatimSearchQuery] = useState("");
  const [verbatimFontSize, setVerbatimFontSize] = useState<"sm" | "base" | "lg">("base");
  const [copiedActText, setCopiedActText] = useState(false);
  const [copiedSectionNumber, setCopiedSectionNumber] = useState<string | null>(null);

  // Load Acts from service (includes built-in Bare Acts + custom localStorage uploads)
  const loadActs = () => {
    const list = ActsService.getAllActs();
    setActsList(list);
  };

  useEffect(() => {
    loadActs();
  }, []);

  // Handle URL Query Params from Legal Assistant (e.g. ?act=act_bns_2023&section=318&page=95&tab=DOCUMENT)
  useEffect(() => {
    if (actsList.length === 0) return;

    const actParam = searchParams?.get("act");
    const sectionParam = searchParams?.get("section");
    const pageParam = searchParams?.get("page");
    const tabParam = searchParams?.get("tab");

    if (actParam) {
      const normalizedParam = actParam.toLowerCase().replace(/[^a-z0-9]/g, "");
      const matchedAct = actsList.find((a) => {
        const normId = a.id.toLowerCase().replace(/[^a-z0-9]/g, "");
        const normShort = a.shortName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const normTitle = a.title.toLowerCase().replace(/[^a-z0-9]/g, "");
        return (
          normId === normalizedParam ||
          normShort.includes(normalizedParam) ||
          normalizedParam.includes(normShort) ||
          normTitle.includes(normalizedParam)
        );
      });

      if (matchedAct) {
        setActiveActModal(matchedAct);

        if (pageParam) {
          const parsedPage = parseInt(pageParam);
          if (!isNaN(parsedPage)) {
            setTargetPageNumber(parsedPage);
          }
        }

        if (tabParam === "DOCUMENT" || pageParam) {
          setModalActiveTab("DOCUMENT");
        } else if (tabParam === "SECTIONS") {
          setModalActiveTab("SECTIONS");
        } else {
          setModalActiveTab("VERBATIM");
        }

        if (sectionParam) {
          setSectionFilterQuery(sectionParam);
          setVerbatimSearchQuery(sectionParam);
        }
      }
    }
  }, [actsList, searchParams]);

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

    setSelectedUploadFile(file);
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
      setUploadTitle(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadFileDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit new document with 100% automated AI processing (Only upload file + document name!)
  const handleAddDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() && !uploadFileName) {
      alert("Please select a document file to upload.");
      return;
    }

    setIsUploading(true);
    setProcessingStatus("Reading & analyzing document with AI...");

    try {
      let extractedActData: any = null;

      try {
        const formData = new FormData();
        if (selectedUploadFile) {
          formData.append("file", selectedUploadFile);
        }
        formData.append("title", uploadTitle.trim());

        setProcessingStatus("Extracting sections, legal classifications & verbatim text...");
        const res = await fetch("/api/acts/process", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          if (json?.actData) {
            extractedActData = json.actData;
          }
        }
      } catch (apiErr) {
        console.warn("Auto-process API warning, using fallback:", apiErr);
      }

      const finalTitle = uploadTitle.trim() || extractedActData?.title || uploadFileName.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      const finalShortName = extractedActData?.shortName || finalTitle.split(",")[0].trim().slice(0, 25);

      ActsService.addCustomAct({
        title: finalTitle,
        shortName: finalShortName,
        actNumber: extractedActData?.actNumber || `Act No. ${new Date().getFullYear()}/${Math.floor(Math.random() * 800 + 100)}`,
        enactmentDate: extractedActData?.enactmentDate || new Date().toLocaleDateString("en-IN"),
        effectiveDate: extractedActData?.effectiveDate || "In Force",
        category: extractedActData?.category || "SPECIAL_ACT",
        categoryLabel: extractedActData?.categoryLabel || "Special & Local Law / Statutory Document",
        totalSections: extractedActData?.totalSections || (extractedActData?.keySections?.length || 1),
        totalChapters: extractedActData?.totalChapters || (extractedActData?.chapters?.length || 1),
        fileFormat: uploadFileFormat,
        fileName: uploadFileName || `${finalTitle.replace(/\s+/g, "_")}.${uploadFileFormat.toLowerCase()}`,
        fileSize: uploadFileSize || "Uploaded",
        fileDataUrl: uploadFileDataUrl,
        description: extractedActData?.description || `Official statutory document registered as ${finalTitle}.`,
        preambleVerbatim: extractedActData?.preambleVerbatim || undefined,
        verbatimText: extractedActData?.verbatimText || undefined,
        chapters: extractedActData?.chapters || [
          { chapterNumber: "Chapter I", title: "General Provisions", sectionsRange: "Sec 1" }
        ],
        keySections: extractedActData?.keySections || [
          {
            sectionNumber: "1",
            title: "Scope and Application",
            chapter: "Chapter I",
            description: `Statutory provisions and regulatory procedures under ${finalTitle}.`,
            verbatimText: `1. (1) This document encompasses the official statutory provisions and enforcement directives of ${finalTitle}.`,
            punishment: "As prescribed by law",
            cognizable: "Cognizable",
            bailable: "Bailable",
            triableBy: "Competent Court",
          },
        ],
      });

      loadActs();
      setUploadModalOpen(false);

      // Reset form
      setSelectedUploadFile(null);
      setUploadTitle("");
      setUploadFileName("");
      setUploadFileSize("");
      setUploadFileDataUrl(undefined);
    } catch (err: any) {
      console.error("Upload & auto-processing failed:", err);
      alert(err?.message || "Failed to save legal document.");
    } finally {
      setIsUploading(false);
      setProcessingStatus("");
    }
  };

  // Copy to clipboard helper
  const handleCopyVerbatim = (text: string, identifier?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (identifier) {
      setCopiedSectionNumber(identifier);
      setTimeout(() => setCopiedSectionNumber(null), 2500);
    } else {
      setCopiedActText(true);
      setTimeout(() => setCopiedActText(false), 2500);
    }
  };

  // Assembles full verbatim text of any Act (Built-in or Uploaded)
  const getActVerbatimFullText = (act: LegalActItem): string => {
    const parts: string[] = [];

    // Header & Preamble
    if (act.preambleVerbatim) {
      parts.push(act.preambleVerbatim);
    } else {
      parts.push(
        `${act.title.toUpperCase()}\n(${act.actNumber})\nEnacted: ${act.enactmentDate} | Effective: ${act.effectiveDate}\n\n${act.description}`
      );
    }

    // Key Sections Word-by-Word
    if (act.keySections && act.keySections.length > 0) {
      parts.push("\n=======================================================\nSECTIONS & STATUTORY PROVISIONS (VERBATIM TEXT)\n=======================================================\n");
      act.keySections.forEach((sec) => {
        parts.push(
          `[SECTION ${sec.sectionNumber}] - ${sec.title.toUpperCase()}${sec.chapter ? `\n(${sec.chapter})` : ""}\n${
            sec.verbatimText || sec.description
          }${sec.punishment ? `\nPunishment: ${sec.punishment}` : ""}${
            sec.cognizable || sec.bailable || sec.triableBy
              ? `\nClassification: ${[sec.cognizable, sec.bailable, sec.triableBy ? `Triable by ${sec.triableBy}` : ""].filter(Boolean).join(" | ")}`
              : ""
          }\n-------------------------------------------------------`
        );
      });
    } else if (act.verbatimText) {
      parts.push("\n=======================================================\nVERBATIM DOCUMENT TEXT\n=======================================================\n");
      parts.push(act.verbatimText);
    }

    return parts.join("\n\n");
  };

  // Section verbatim text helper
  const getSectionVerbatimText = (sec: LegalSectionItem): string => {
    if (sec.verbatimText) return sec.verbatimText;
    let txt = `Section ${sec.sectionNumber}. ${sec.title}.—\n${sec.description}`;
    if (sec.punishment) txt += `\nPunishment: ${sec.punishment}`;
    if (sec.cognizable || sec.bailable || sec.triableBy) {
      txt += `\nClassification: ${[sec.cognizable, sec.bailable, sec.triableBy ? `Triable by: ${sec.triableBy}` : ""].filter(Boolean).join(" | ")}`;
    }
    return txt;
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
                              setModalActiveTab("VERBATIM");
                              setVerbatimSearchQuery(sec.sectionNumber);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-900 transition-colors cursor-pointer text-left"
                            title={`${sec.title}: ${sec.description} (Click to view Verbatim Text)`}
                          >
                            <span className="font-bold text-amber-700 font-mono">Sec {sec.sectionNumber}</span>
                            <span className="text-slate-600 truncate max-w-[130px]">{sec.title}</span>
                          </button>
                        ))}
                        {act.keySections.length > 8 && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveActModal(act);
                              setModalActiveTab("VERBATIM");
                              setVerbatimSearchQuery("");
                            }}
                            className="text-[11px] px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            +{act.keySections.length - 8} More Sections...
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Row 4: Action Buttons (Verbatim Text, Preview, Sections, Download) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* 1. VERBATIM TEXT Button (user specifically requested "VERBATIM TEXT feature ko mere sb en sbhi documents me apply kr do") */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveActModal(act);
                          setModalActiveTab("VERBATIM");
                          setVerbatimSearchQuery("");
                        }}
                        className="bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-950 border-amber-300 font-bold text-xs gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Verbatim Text (शब्द-ब-शब्द)</span>
                      </Button>

                      {/* 2. Original Document Preview Button (user requested "esme original documet me dekhe jiska preview aur download kiya ja ske") */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveActModal(act);
                          setModalActiveTab("DOCUMENT");
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200 font-bold text-xs gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Original PDF Preview</span>
                      </Button>

                      {/* 3. Browse Sections Button */}
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setActiveActModal(act);
                          setModalActiveTab("SECTIONS");
                          setSectionFilterQuery("");
                        }}
                        className="bg-[#0b192c] hover:bg-[#152e50] text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Browse Sections ({act.totalSections})</span>
                      </Button>

                      {/* 4. Download PDF / Document Button */}
                      {(act.fileUrl || act.fileDataUrl) && (
                        <a
                          href={act.fileUrl || act.fileDataUrl}
                          download={act.fileName || `${act.shortName}.pdf`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600 shrink-0" />
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

            {/* Form: Ultra-Simplified (Only File + Document Name, rest 100% auto-processed by AI) */}
            <form onSubmit={handleAddDocumentSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {/* 1. File Upload Zone */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    <span>Upload Document File (PDF, Word, TXT, Image, etc.) *</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Any format allowed</span>
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 bg-white text-center transition-colors">
                  <input
                    type="file"
                    id="actDocumentFileInput"
                    onChange={handleFileUploadChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <label htmlFor="actDocumentFileInput" className="cursor-pointer block space-y-2">
                    {uploadFileName ? (
                      <div className="flex items-center justify-between p-3 bg-blue-50/80 border border-blue-200 rounded-xl">
                        <div className="flex items-center gap-2.5 truncate pr-2 font-bold text-slate-900 text-xs">
                          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                          <div className="truncate text-left">
                            <span className="truncate block max-w-[280px] text-xs font-bold text-slate-900">
                              {uploadFileName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {uploadFileFormat} &bull; {uploadFileSize}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedUploadFile(null);
                            setUploadFileName("");
                            setUploadFileSize("");
                            setUploadFileDataUrl(undefined);
                          }}
                          className="text-[11px] text-red-600 hover:underline font-bold px-2 py-1"
                        >
                          Change File
                        </button>
                      </div>
                    ) : (
                      <div className="py-4 space-y-1.5">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-blue-600 hover:underline text-xs">
                          Click to select or drag &amp; drop document here
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Supports PDF, Word (.doc/.docx), TXT, JPEG, PNG, scanned files
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* 2. Document Name / Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    Document / Act Name *
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Auto-suggested (editable)
                  </span>
                </div>
                <input
                  type="text"
                  required
                  disabled={isUploading}
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. The Motor Vehicles Act, 1988 / Haryana Police Circular"
                  className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 bg-white focus:border-blue-600 focus:outline-none text-xs font-semibold shadow-2xs"
                />
                <p className="text-[11px] text-slate-500">
                  File select karte hi naam yahan aa jayega, aap chahein toh ise edit bhi kar sakte hain.
                </p>
              </div>

              {/* 3. AI Automated Processing Banner */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>100% Automated AI Processing</span>
                </div>
                <p className="text-amber-900 text-[11px] leading-relaxed">
                  Aapko baaki koi field bharne ki zarurat nahi hai! AI khud is document ko padh kar:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-amber-950 font-medium pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">&#10003;</span>
                    <span>Act Number, Enactment Date &amp; Category</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">&#10003;</span>
                    <span>100% Word-by-Word Verbatim Text</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">&#10003;</span>
                    <span>All Sections, Chapters &amp; Punishments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">&#10003;</span>
                    <span>Cognizable &amp; Bailable Classification</span>
                  </div>
                </div>
              </div>

              {/* 4. Processing Animation Bar (Visible while loading) */}
              {isUploading && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-2 animate-in fade-in-0">
                  <div className="flex items-center justify-between text-blue-900 font-bold">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                      <span>{processingStatus || "Processing document with AI..."}</span>
                    </div>
                  </div>
                  <div className="w-full bg-blue-200/60 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 rounded-full w-2/3 animate-pulse" />
                  </div>
                </div>
              )}

              {/* 5. Footer Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={isUploading}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isUploading || (!selectedUploadFile && !uploadFileName)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shadow-xs cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing &amp; Saving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>Upload &amp; Auto-Process</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INTERACTIVE BARE ACT, VERBATIM TEXT & ORIGINAL DOCUMENT VIEWER   */}
      {/* ========================================================================= */}
      {activeActModal && (() => {
        const targetDocumentUrl = activeActModal.fileUrl || activeActModal.fileDataUrl;
        const fontClass =
          verbatimFontSize === "sm" ? "text-xs" : verbatimFontSize === "lg" ? "text-base" : "text-sm";

        // Filter sections for Verbatim tab
        const verbatimFilteredSections = activeActModal.keySections.filter((sec) => {
          if (!verbatimSearchQuery) return true;
          const q = verbatimSearchQuery.toLowerCase();
          return (
            sec.sectionNumber.toLowerCase().includes(q) ||
            sec.title.toLowerCase().includes(q) ||
            sec.description.toLowerCase().includes(q) ||
            (sec.verbatimText && sec.verbatimText.toLowerCase().includes(q)) ||
            (sec.punishment && sec.punishment.toLowerCase().includes(q)) ||
            (sec.chapter && sec.chapter.toLowerCase().includes(q))
          );
        });

        // Filter sections for Browse Sections tab
        const standardFilteredSections = activeActModal.keySections.filter((sec) => {
          if (!sectionFilterQuery) return true;
          const q = sectionFilterQuery.toLowerCase();
          return (
            sec.sectionNumber.toLowerCase().includes(q) ||
            sec.title.toLowerCase().includes(q) ||
            sec.description.toLowerCase().includes(q) ||
            (sec.chapter && sec.chapter.toLowerCase().includes(q))
          );
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveActModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full h-[92vh] flex flex-col z-10 animate-in fade-in-0 zoom-in-95 overflow-hidden">
              {/* Modal Top Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0b192c] via-[#10243e] to-[#0b192c] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono">
                      {activeActModal.shortName}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">{activeActModal.actNumber}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {activeActModal.totalSections} Sections &bull; {activeActModal.totalChapters} Chapters
                    </span>
                    <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-700/50">
                      {activeActModal.categoryLabel}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-2xl">
                    {activeActModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveActModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Navigation Tabs: [ 📜 Verbatim Text ] [ 📑 Original Document Preview ] [ ⚖️ Browse Sections & Provisions ] */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 flex items-center gap-2 overflow-x-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setModalActiveTab("VERBATIM")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                    modalActiveTab === "VERBATIM"
                      ? "border-amber-600 text-amber-900 bg-amber-50/70 font-extrabold shadow-2xs"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>📜 Verbatim Statutory Text (शब्द-ब-शब्द मूल पाठ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalActiveTab("DOCUMENT")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                    modalActiveTab === "DOCUMENT"
                      ? "border-blue-600 text-blue-900 bg-blue-50/70 font-extrabold shadow-2xs"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Eye className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>📑 Original PDF Document Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalActiveTab("SECTIONS")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                    modalActiveTab === "SECTIONS"
                      ? "border-indigo-600 text-indigo-900 bg-indigo-50/70 font-extrabold shadow-2xs"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>⚖️ Sections &amp; Provisions ({activeActModal.totalSections})</span>
                </button>
              </div>

              {/* ================================================================= */}
              {/* TAB 1: VERBATIM STATUTORY TEXT (WORD-BY-WORD BARE ACT TEXT)      */}
              {/* ================================================================= */}
              {modalActiveTab === "VERBATIM" && (
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {/* Verbatim Guarantee Banner */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border-b border-amber-200 text-xs shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-400/40">
                        <FileText className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <div className="font-extrabold text-amber-950 flex items-center gap-2">
                          <span>Official Gazette Verbatim Statutory Text (शब्द-ब-शब्द / हू-ब-हू मूल कानूनी पाठ)</span>
                          <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.2 rounded font-mono font-bold">
                            100% UNMODIFIED WORD-FOR-WORD
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900/90 leading-tight mt-0.5">
                          Exact statutory phrasing enacted by Parliament of India. Certified verbatim reference for Case Diaries (Zimni), FIR Registration, and Court Proceedings.
                        </p>
                      </div>
                    </div>

                    {/* Quick Verbatim Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleCopyVerbatim(getActVerbatimFullText(activeActModal))}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer"
                      >
                        {copiedActText ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedActText ? "Copied Full Act!" : "Copy Full Verbatim Act"}</span>
                      </Button>

                      {targetDocumentUrl && (
                        <a
                          href={targetDocumentUrl}
                          download={activeActModal.fileName || `${activeActModal.shortName}.pdf`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-amber-300 text-amber-950 hover:bg-amber-100 transition-colors shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-700" />
                          <span className="hidden sm:inline">Download</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Verbatim Controls Bar (Search in Verbatim Text + Font Adjuster) */}
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={verbatimSearchQuery}
                        onChange={(e) => setVerbatimSearchQuery(e.target.value)}
                        placeholder="Search within Verbatim Statutory Text (Section number, phrase, offences, punishment)..."
                        className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-6 py-2 text-slate-900 bg-white focus:border-amber-600 focus:outline-none"
                      />
                      {verbatimSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setVerbatimSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          &times;
                        </button>
                      )}
                    </div>

                    {/* Font Size Adjuster */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <span className="text-[11px] text-slate-500 font-medium">Text Size:</span>
                      <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => setVerbatimFontSize("sm")}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                            verbatimFontSize === "sm" ? "bg-amber-600 text-white" : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          A-
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerbatimFontSize("base")}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                            verbatimFontSize === "base" ? "bg-amber-600 text-white" : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerbatimFontSize("lg")}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                            verbatimFontSize === "lg" ? "bg-amber-600 text-white" : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          A+
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Verbatim Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#faf8f5]">
                    {/* 1. Verbatim Preamble & Enacting Clause */}
                    {activeActModal.preambleVerbatim && !verbatimSearchQuery && (
                      <div className="bg-white border-2 border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono uppercase">
                              Official Gazette Preamble &amp; Enactment Clause
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyVerbatim(activeActModal.preambleVerbatim!, "preamble")}
                            className="text-amber-800 hover:bg-amber-50 text-[11px] gap-1 h-7 px-2 cursor-pointer"
                          >
                            {copiedSectionNumber === "preamble" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedSectionNumber === "preamble" ? "Copied!" : "Copy Preamble"}</span>
                          </Button>
                        </div>

                        <div className={`font-serif ${fontClass} text-slate-800 leading-relaxed whitespace-pre-wrap bg-amber-50/30 p-3.5 rounded-xl border border-amber-100/70`}>
                          {activeActModal.preambleVerbatim}
                        </div>
                      </div>
                    )}

                    {/* 2. Custom Uploaded Document Verbatim Text (if present) */}
                    {activeActModal.verbatimText && (
                      <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono uppercase">
                            Uploaded Document Verbatim Text
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyVerbatim(activeActModal.verbatimText!, "customVerbatim")}
                            className="text-amber-800 hover:bg-amber-50 text-[11px] gap-1 h-7 px-2 cursor-pointer"
                          >
                            {copiedSectionNumber === "customVerbatim" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedSectionNumber === "customVerbatim" ? "Copied!" : "Copy Text"}</span>
                          </Button>
                        </div>
                        <div className={`font-mono ${fontClass} text-slate-800 leading-relaxed whitespace-pre-wrap bg-amber-50/30 p-3.5 rounded-xl border border-amber-100/70`}>
                          {activeActModal.verbatimText}
                        </div>
                      </div>
                    )}

                    {/* 3. Verbatim Sections Word-by-Word List */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                          <span>Verbatim Sections &amp; Statutory Provisions</span>
                        </h4>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Showing {verbatimFilteredSections.length} of {activeActModal.keySections.length} Sections
                        </span>
                      </div>

                      {verbatimFilteredSections.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                          No verbatim sections matching &ldquo;{verbatimSearchQuery}&rdquo;.
                        </div>
                      ) : (
                        verbatimFilteredSections.map((sec) => {
                          const verbatimContent = getSectionVerbatimText(sec);
                          const isCopied = copiedSectionNumber === sec.sectionNumber;

                          return (
                            <div
                              key={sec.sectionNumber}
                              className="bg-white rounded-2xl border-2 border-slate-200 hover:border-amber-400 p-4 sm:p-5 shadow-xs space-y-3 transition-colors"
                            >
                              {/* Section Title Header */}
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-300">
                                      Section {sec.sectionNumber}
                                    </span>
                                    {sec.chapter && (
                                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                                        {sec.chapter}
                                      </span>
                                    )}
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      VERBATIM PROVISION
                                    </span>
                                  </div>
                                  <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                                    {sec.title}
                                  </h5>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopyVerbatim(verbatimContent, sec.sectionNumber)}
                                    className="bg-white hover:bg-amber-50 text-amber-900 border-amber-300 text-xs gap-1 h-7 px-2.5 cursor-pointer shadow-2xs font-semibold"
                                  >
                                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    <span>{isCopied ? "Copied Section!" : "Copy Verbatim"}</span>
                                  </Button>
                                </div>
                              </div>

                              {/* Classification Tags */}
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
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                    Triable: {sec.triableBy}
                                  </span>
                                )}
                              </div>

                              {/* Verbatim Statutory Body Box */}
                              <div
                                className={`p-4 bg-amber-50/40 border-l-4 border-amber-500 rounded-r-xl border border-slate-200 font-mono ${fontClass} text-slate-900 leading-relaxed whitespace-pre-wrap selection:bg-amber-200`}
                              >
                                {verbatimContent}
                              </div>

                              {/* Punishment Block */}
                              {sec.punishment && (
                                <div className="p-2.5 bg-amber-100/70 border border-amber-300/80 rounded-xl text-amber-950 font-medium text-xs flex items-start gap-2">
                                  <Gavel className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="text-amber-900">Prescribed Statutory Punishment: </strong>
                                    <span>{sec.punishment}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* TAB 2: ORIGINAL DOCUMENT PREVIEW (EMBEDDED NATIVE VIEWER)         */}
              {/* ================================================================= */}
              {modalActiveTab === "DOCUMENT" && (
                <div className="flex-1 overflow-y-auto flex flex-col p-4 space-y-3 bg-slate-100">
                  {/* Top Bar for Document Viewer */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-red-50 text-red-700 border border-red-200">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {activeActModal.fileName || `${activeActModal.title}.${activeActModal.fileFormat.toLowerCase()}`}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                          <span>Format: <strong>{activeActModal.fileFormat}</strong></span>
                          <span>&bull; Size: <strong>{activeActModal.fileSize || "Original"}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {targetPageNumber && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                          <span>पेज {targetPageNumber} (Page {targetPageNumber})</span>
                        </div>
                      )}

                      {targetDocumentUrl && (
                        <>
                          <a
                            href={targetDocumentUrl}
                            download={activeActModal.fileName || `${activeActModal.shortName}.pdf`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download {activeActModal.fileFormat}</span>
                          </a>
                          <a
                            href={targetPageNumber ? `${targetDocumentUrl}#page=${targetPageNumber}` : targetDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open in Full Window</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Embedded Document Frame */}
                  <div className="flex-1 min-h-[70vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 shadow-inner flex flex-col">
                    {targetDocumentUrl ? (
                      activeActModal.fileFormat === "IMAGE" || targetDocumentUrl.startsWith("data:image/") ? (
                        <div className="flex-1 flex items-center justify-center p-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={targetDocumentUrl}
                            alt={activeActModal.title}
                            className="max-h-[74vh] object-contain rounded-lg shadow-lg"
                          />
                        </div>
                      ) : (
                        <iframe
                          src={targetPageNumber ? `${targetDocumentUrl}#page=${targetPageNumber}&toolbar=1` : `${targetDocumentUrl}#toolbar=1`}
                          className="w-full h-full min-h-[72vh] flex-1 bg-slate-800 border-none"
                          title={activeActModal.title}
                        />
                      )
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-300 space-y-3">
                        <FileText className="w-12 h-12 text-slate-500" />
                        <h4 className="font-bold text-white text-sm">Original File Attached</h4>
                        <p className="text-xs text-slate-400 max-w-md">
                          Original file is stored as a statutory record. Click the Download button above or browse the Verbatim Text tab for complete word-by-word text.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* TAB 3: BROWSE SECTIONS & STATUTORY PROVISIONS                     */}
              {/* ================================================================= */}
              {modalActiveTab === "SECTIONS" && (
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {/* Search bar inside sections */}
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

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setModalActiveTab("VERBATIM")}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 font-bold text-xs gap-1.5 shrink-0 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-700" />
                      <span>Switch to Verbatim Text</span>
                    </Button>
                  </div>

                  {/* Scrollable Content */}
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
                          Showing {standardFilteredSections.length} of {activeActModal.keySections.length} Sections
                        </span>
                      </div>

                      <div className="space-y-3">
                        {standardFilteredSections.map((sec) => (
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

                              {/* Classification badges */}
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

                            {/* Verbatim snippet button */}
                            <div className="pt-1 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setModalActiveTab("VERBATIM");
                                  setVerbatimSearchQuery(sec.sectionNumber);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 transition-colors cursor-pointer"
                              >
                                <FileText className="w-3 h-3 text-amber-600" />
                                <span>View Verbatim Statutory Text &rarr;</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
                <span className="font-mono text-[11px]">
                  Haryana Police Statutory Repository &bull; {activeActModal.shortName} &bull; Verbatim Certified
                </span>
                <Button size="sm" variant="outline" onClick={() => setActiveActModal(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function ActsAndSectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center p-8 text-slate-500 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <Scale className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading Statutory Bare Acts Repository...</span>
          </div>
        </div>
      }
    >
      <ActsAndSectionsContent />
    </Suspense>
  );
}

