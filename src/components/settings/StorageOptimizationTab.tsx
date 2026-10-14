"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Search,
  Filter,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Film,
  Sparkles,
  Archive,
  Eye,
  Loader2,
  ArrowDownToLine,
  Check,
  Copy,
  Layers,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UniversalEvidenceRecord } from "@/types/evidence";
import { CaseEvidenceDataModal } from "@/components/evidence/CaseEvidenceDataModal";

interface StorageStats {
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  totalSavedBytes: number;
  totalSavedPercentage: number;
  totalFiles: number;
  verifiedCount: number;
  retainedCount: number;
  failedCount: number;
  pendingCount: number;
  categoryBreakdown: {
    category: string;
    originalBytes: number;
    compressedBytes: number;
    savedBytes: number;
    count: number;
  }[];
}

interface EvidenceFileRow {
  id: string;
  fileId: string;
  caseId: string | null;
  caseNumber: string;
  module: string;
  fileName: string;
  fileType: string;
  originalSizeBytes: number;
  originalSha256: string;
  uploadedAt: string;
  uploadedBy: string;
  compression: {
    status: "VERIFIED_LOSSLESS" | "ORIGINAL_RETAINED" | "PENDING_VERIFICATION" | "FAILED_VERIFICATION";
    originalSizeBytes: number;
    compressedSizeBytes: number;
    savedBytes: number;
    savedPercentage: number;
    verifiedLossless: boolean;
    compressionMethod: string;
    compressedSha256?: string;
    failureReason?: string;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function StorageOptimizationTab() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [records, setRecords] = useState<EvidenceFileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [processingRecordId, setProcessingRecordId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal inspection
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<UniversalEvidenceRecord | null>(null);

  const fetchStatsAndRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/evidence/compress");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setRecords(data.records || []);
        }
      }
    } catch (err) {
      console.error("Error loading storage stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndRecords();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyHash = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunBatchCompression = async (force: boolean = false) => {
    setIsBatchRunning(true);
    try {
      const res = await fetch("/api/evidence/compress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: true, force }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(
          `Batch optimization complete: ${data.batchResult?.verifiedLossless || 0} files verified lossless, ${data.batchResult?.originalRetained || 0} files optimal.`
        );
        await fetchStatsAndRecords();
      } else {
        alert("Batch optimization failed");
      }
    } catch (err: any) {
      alert("Batch compression error: " + (err.message || "Unknown"));
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleCompressSingle = async (recordId: string) => {
    setProcessingRecordId(recordId);
    try {
      const res = await fetch("/api/evidence/compress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast(`File verified lossless: ${data.compression?.savedPercentage || 0}% saved.`);
          await fetchStatsAndRecords();
        }
      }
    } catch (err) {
      console.error("Single compression error:", err);
    } finally {
      setProcessingRecordId(null);
    }
  };

  const handleOpenEvidenceModal = async (recordId: string) => {
    try {
      const res = await fetch(`/api/evidence/store?id=${encodeURIComponent(recordId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.record) {
          setSelectedRecordForModal(data.record);
        }
      }
    } catch (err) {
      console.error("Failed to load evidence record for modal:", err);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.fileName.toLowerCase().includes(q) ||
        r.caseNumber.toLowerCase().includes(q) ||
        (r.originalSha256 && r.originalSha256.toLowerCase().includes(q));

      // Category
      const name = r.fileName.toLowerCase();
      let cat = "OTHER";
      if (name.endsWith(".pdf")) cat = "PDF";
      else if (
        name.endsWith(".png") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".webp") ||
        name.endsWith(".tiff") ||
        name.endsWith(".bmp")
      )
        cat = "IMAGE";
      else if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) cat = "SPREADSHEET";
      else if (
        name.endsWith(".mp3") ||
        name.endsWith(".wav") ||
        name.endsWith(".m4a") ||
        name.endsWith(".mp4") ||
        name.endsWith(".avi")
      )
        cat = "MEDIA";

      const matchesCat = categoryFilter === "ALL" || categoryFilter === cat;

      // Status
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "VERIFIED" && r.compression.status === "VERIFIED_LOSSLESS") ||
        (statusFilter === "RETAINED" && r.compression.status === "ORIGINAL_RETAINED") ||
        (statusFilter === "PENDING" &&
          (r.compression.status === "PENDING_VERIFICATION" || !r.compression.status));

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [records, searchQuery, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Haryana Police Lossless Evidence Storage System
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                100% Cryptographic Integrity Guarantee
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              Evidence Storage Optimization & Lossless Compression
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Provides genuine lossless compression across all heavy police evidence (scanned documents, photographs,
              surveillance media, forensic spreadsheets, and complaint dockets). Original authoritative evidence is
              permanently preserved alongside verified lossless compressed copies with SHA-256 roundtrip checksums.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              disabled={isBatchRunning || loading}
              onClick={() => handleRunBatchCompression(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 gap-2 rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.02]"
            >
              {isBatchRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isBatchRunning ? "Optimizing Entire Storage..." : "Run System-Wide Lossless Optimization"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading || isBatchRunning}
              onClick={fetchStatsAndRecords}
              className="text-xs font-semibold text-slate-200 border-slate-700 hover:bg-slate-800 gap-1.5 rounded-xl cursor-pointer"
              title="Refresh Storage Metrics"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Storage Saved */}
        <Card className="border-slate-200/80 bg-white shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Storage Saved</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ArrowDownToLine className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-700 tracking-tight">
                {stats ? formatBytes(stats.totalSavedBytes) : "0 B"}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <span className="font-bold text-emerald-600">
                  {stats ? `${stats.totalSavedPercentage}%` : "0%"} reduction
                </span>
                <span>across evidence storage</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats?.totalSavedPercentage || 0)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Verified Lossless Files */}
        <Card className="border-slate-200/80 bg-white shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Verified Lossless Files</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {stats ? stats.verifiedCount : 0}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <span className="font-bold text-blue-600">100% roundtrip verified</span>
                <span>zero quality loss</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    stats?.totalFiles ? (stats.verifiedCount / stats.totalFiles) * 100 : 0
                  }%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Authoritative Originals Preserved */}
        <Card className="border-slate-200/80 bg-white shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Authoritative Originals</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Archive className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {stats ? stats.totalFiles : 0}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <span className="font-bold text-purple-600">100% Retained</span>
                <span>never overwritten or deleted</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-purple-500 h-1.5 rounded-full w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Optimal / Retained Status */}
        <Card className="border-slate-200/80 bg-white shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Optimal Formats Retained</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {stats ? stats.retainedCount : 0}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <span>Already compressed / minimal gain</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    stats?.totalFiles ? (stats.retainedCount / stats.totalFiles) * 100 : 0
                  }%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Lossless Storage Optimization by Evidence Category</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of original evidentiary footprint vs. verified lossless compressed storage.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Total Files Monitored: <strong className="text-slate-800">{records.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {(stats?.categoryBreakdown || []).map((cat, idx) => {
            let Icon = FileText;
            let iconColor = "text-blue-600 bg-blue-50";
            if (cat.category.includes("Photographs")) {
              Icon = ImageIcon;
              iconColor = "text-purple-600 bg-purple-50";
            } else if (cat.category.includes("Spreadsheets")) {
              Icon = FileSpreadsheet;
              iconColor = "text-emerald-600 bg-emerald-50";
            } else if (cat.category.includes("Audio")) {
              Icon = Film;
              iconColor = "text-rose-600 bg-rose-50";
            }

            const pct = cat.originalBytes > 0 ? ((cat.savedBytes / cat.originalBytes) * 100).toFixed(1) : "0";

            return (
              <div
                key={idx}
                className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2 hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-7 h-7 rounded-lg ${iconColor} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                    -{pct}%
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs truncate" title={cat.category}>
                    {cat.category}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {cat.count} files • {formatBytes(cat.originalBytes)}
                  </p>
                </div>
                <div className="text-[11px] text-slate-600 border-t border-slate-200/60 pt-1.5 flex justify-between">
                  <span>Space Saved:</span>
                  <strong className="text-emerald-700 font-mono">{formatBytes(cat.savedBytes)}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name, case number, or SHA-256 hash..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="PDF">PDF Documents</option>
              <option value="IMAGE">Images & Photos</option>
              <option value="SPREADSHEET">Excel & Data Files</option>
              <option value="MEDIA">Audio & Video</option>
              <option value="OTHER">Other Documents</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified Lossless</option>
              <option value="RETAINED">Original Retained</option>
              <option value="PENDING">Pending Optimization</option>
            </select>
          </div>
        </div>

        {/* Evidence Files Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3">Evidence File & Case</th>
                <th className="py-2.5 px-3">Original Size</th>
                <th className="py-2.5 px-3">Lossless Size</th>
                <th className="py-2.5 px-3">Space Saved</th>
                <th className="py-2.5 px-3">Status & Verification</th>
                <th className="py-2.5 px-3">Cryptographic SHA-256</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No evidence files match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => {
                  const isVerified = row.compression.status === "VERIFIED_LOSSLESS";
                  const isRetained = row.compression.status === "ORIGINAL_RETAINED";
                  const isPending = !row.compression.status || row.compression.status === "PENDING_VERIFICATION";
                  const isRowProcessing = processingRecordId === row.id;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Evidence File & Case */}
                      <td className="py-3 px-3 max-w-[240px]">
                        <div className="font-semibold text-slate-900 truncate" title={row.fileName}>
                          {row.fileName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono text-slate-700">{row.caseNumber}</span>
                          <span>• {row.module}</span>
                        </div>
                      </td>

                      {/* Original Size */}
                      <td className="py-3 px-3 font-mono text-slate-800">
                        {formatBytes(row.originalSizeBytes)}
                      </td>

                      {/* Lossless Size */}
                      <td className="py-3 px-3 font-mono">
                        {isVerified ? (
                          <span className="text-emerald-700 font-bold">
                            {formatBytes(row.compression.compressedSizeBytes)}
                          </span>
                        ) : (
                          <span className="text-slate-600">{formatBytes(row.originalSizeBytes)}</span>
                        )}
                      </td>

                      {/* Space Saved */}
                      <td className="py-3 px-3">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                            -{row.compression.savedPercentage}%
                          </span>
                        ) : isRetained ? (
                          <span className="text-[10px] text-slate-500 font-medium">Optimal (0%)</span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium">Pending</span>
                        )}
                      </td>

                      {/* Status & Verification */}
                      <td className="py-3 px-3">
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            VERIFIED_LOSSLESS
                          </span>
                        )}
                        {isRetained && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md"
                            title={row.compression.failureReason || "File is in optimal format"}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            ORIGINAL_RETAINED
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            PENDING_VERIFICATION
                          </span>
                        )}
                      </td>

                      {/* SHA-256 */}
                      <td className="py-3 px-3 max-w-[150px]">
                        <div className="flex items-center gap-1">
                          <span
                            className="font-mono text-[10px] text-slate-500 truncate"
                            title={row.originalSha256}
                          >
                            {row.originalSha256 ? `${row.originalSha256.substring(0, 10)}...` : "N/A"}
                          </span>
                          {row.originalSha256 && (
                            <button
                              type="button"
                              onClick={() => handleCopyHash(row.originalSha256, row.id)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                              title="Copy Full SHA-256 Hash"
                            >
                              {copiedId === row.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Modal */}
                          <button
                            type="button"
                            onClick={() => handleOpenEvidenceModal(row.id)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Full Case Evidence Record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Download Original Authoritative */}
                          <a
                            href={`/api/evidence/download?id=${row.id}&type=original`}
                            download={row.fileName}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-200 transition-colors cursor-pointer"
                            title="Download Authoritative Original Evidence File"
                          >
                            <Download className="w-3 h-3 text-slate-600" />
                            <span>Original</span>
                          </a>

                          {/* Download Lossless Compressed */}
                          {isVerified ? (
                            <a
                              href={`/api/evidence/download?id=${row.id}&type=compressed`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-300 transition-colors cursor-pointer"
                              title="Download Verified Lossless Compressed Copy"
                            >
                              <Download className="w-3 h-3 text-emerald-600" />
                              <span>Lossless</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled={isRowProcessing}
                              onClick={() => handleCompressSingle(row.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded border border-purple-200 transition-colors cursor-pointer"
                              title="Run Lossless Compression on this file"
                            >
                              {isRowProcessing ? (
                                <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-purple-600" />
                              )}
                              <span>Optimize</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Evidence Data Inspection Modal */}
      {selectedRecordForModal && (
        <CaseEvidenceDataModal
          record={selectedRecordForModal}
          onClose={() => setSelectedRecordForModal(null)}
          onUpdated={(updated) => {
            setSelectedRecordForModal(updated);
            fetchStatsAndRecords();
          }}
        />
      )}
    </div>
  );
}
