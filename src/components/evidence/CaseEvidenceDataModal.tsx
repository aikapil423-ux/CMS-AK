"use client";

import React, { useState } from "react";
import {
  X,
  Database,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  User,
  Users,
  MapPin,
  Calendar,
  Scale,
  Car,
  Package,
  FileText,
  History,
  ShieldCheck,
  Eye,
  Download,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalEvidenceRecord } from "@/types/evidence";
import { universalEvidenceService } from "@/services/universalEvidenceService";

interface CaseEvidenceDataModalProps {
  record: UniversalEvidenceRecord | null;
  onClose: () => void;
  onUpdated?: (updated: UniversalEvidenceRecord) => void;
  currentOfficerName?: string;
  currentOfficerRole?: string;
  onPreviewFile?: (file: { name: string; dataUrl: string; category?: string; size?: number | string }) => void;
}

export function CaseEvidenceDataModal({
  record,
  onClose,
  onUpdated,
  currentOfficerName = "Officer",
  currentOfficerRole = "Inspector / IO",
  onPreviewFile,
}: CaseEvidenceDataModalProps) {
  const [activeTab, setActiveTab] = useState<"entities" | "raw_text" | "audit">("entities");
  const [copiedHash, setCopiedHash] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Editable fields for human verification
  const [editComplainantName, setEditComplainantName] = useState(
    record?.structuredData?.complainant?.name || ""
  );
  const [editComplainantMobile, setEditComplainantMobile] = useState(
    record?.structuredData?.complainant?.mobile || ""
  );
  const [editComplainantAddress, setEditComplainantAddress] = useState(
    record?.structuredData?.complainant?.address || ""
  );
  const [editIncidentPlace, setEditIncidentPlace] = useState(
    record?.structuredData?.incident?.place || ""
  );
  const [editIncidentSummary, setEditIncidentSummary] = useState(
    record?.structuredData?.incident?.summary || record?.structuredData?.incident?.details || ""
  );

  if (!record) return null;

  const handleCopyHash = () => {
    if (record.rawDocument.sha256Hash) {
      navigator.clipboard.writeText(record.rawDocument.sha256Hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const updated = await universalEvidenceService.verifyAndCorrect({
        recordId: record.id,
        officerName: currentOfficerName,
        officerRole: currentOfficerRole,
        verificationNotes: verificationNotes.trim() || "Verified by Investigating Officer against physical evidence.",
        updatedData: {
          complainant: {
            ...record.structuredData?.complainant,
            name: editComplainantName,
            mobile: editComplainantMobile,
            address: editComplainantAddress,
          },
          incident: {
            ...record.structuredData?.incident,
            place: editIncidentPlace,
            summary: editIncidentSummary,
          },
        },
      });

      setSuccessToast("Case data marked as Human-Verified and saved to persistent database.");
      setTimeout(() => setSuccessToast(null), 3500);
      if (onUpdated) onUpdated(updated);
    } catch (err: any) {
      alert("Verification update failed: " + (err.message || "Unknown error"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const updated = await universalEvidenceService.retryProcessing(record.id, currentOfficerName);
      setSuccessToast("Reprocessing completed successfully!");
      setTimeout(() => setSuccessToast(null), 3500);
      if (onUpdated) onUpdated(updated);
    } catch (err: any) {
      alert("Retry processing failed: " + (err.message || "Unknown error"));
    } finally {
      setIsRetrying(false);
    }
  };

  const isFailed = record.processingStatus === "FAILED";
  const isCompleted = record.processingStatus === "COMPLETED";
  const isHumanVerified = record.verificationStatus === "HUMAN_VERIFIED";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-base truncate">
                  {record.rawDocument.fileName}
                </h3>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    AI Processed & Saved in DB
                  </span>
                )}
                {isHumanVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    Human Verified
                  </span>
                )}
                {isFailed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Processing Failed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Module: <strong className="text-slate-700">{record.module}</strong></span>
                <span>• Case: <strong className="text-slate-700">{record.caseNumber || record.caseId || "N/A"}</strong></span>
                <span>• Engine: <strong className="text-slate-700">{record.processingEngine} (v{record.processingVersion})</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onPreviewFile && record.rawDocument.dataUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onPreviewFile({
                    name: record.rawDocument.fileName,
                    dataUrl: record.rawDocument.dataUrl,
                    category: record.structuredData?.documentCategory || "EVIDENCE",
                    size: record.rawDocument.fileSize,
                  })
                }
                className="text-xs font-semibold gap-1.5 cursor-pointer hidden sm:inline-flex"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Original File</span>
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SHA-256 Checksum Bar */}
        <div className="bg-slate-100/90 px-5 py-2 border-b border-slate-200 text-xs flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 truncate">
            <span className="font-semibold text-slate-800">SHA-256 Checksum:</span>
            <span className="text-slate-500 truncate" title={record.rawDocument.sha256Hash}>
              {record.rawDocument.sha256Hash || "N/A"}
            </span>
            {record.rawDocument.sha256Hash && (
              <button
                type="button"
                onClick={handleCopyHash}
                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 text-[10px] cursor-pointer"
                title="Copy SHA-256 Hash"
              >
                {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Size: {(record.rawDocument.fileSize / 1024).toFixed(1)} KB • Process Once & Reuse Everywhere
          </span>
        </div>

        {/* Toast */}
        {successToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Sub-Tabs Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("entities")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "entities"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Structured Case Data</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("raw_text")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "raw_text"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Verbatim Extracted Text ({record.extractedText?.length || 0} chars)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "audit"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({record.auditTrail?.length || 0})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">
          {activeTab === "entities" && (
            <div className="space-y-4 text-xs">
              {/* Complainant Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Complainant / प्रार्थी Details</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">Source: AI Extraction</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Name</label>
                    <input
                      type="text"
                      value={editComplainantName}
                      onChange={(e) => setEditComplainantName(e.target.value)}
                      placeholder="Not specified"
                      className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Mobile</label>
                    <input
                      type="text"
                      value={editComplainantMobile}
                      onChange={(e) => setEditComplainantMobile(e.target.value)}
                      placeholder="Not specified"
                      className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Address / Residence</label>
                    <input
                      type="text"
                      value={editComplainantAddress}
                      onChange={(e) => setEditComplainantAddress(e.target.value)}
                      placeholder="Not specified"
                      className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Accused Cards */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <Users className="w-4 h-4 text-red-600" />
                    <span>Accused Persons / आरोपी ({(record.structuredData?.accusedList || []).length})</span>
                  </h4>
                </div>
                {record.structuredData?.accusedList && record.structuredData.accusedList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {record.structuredData.accusedList.map((acc, i) => (
                      <div key={i} className="p-3 bg-red-50/50 rounded-lg border border-red-200 space-y-1">
                        <p className="font-bold text-slate-900 text-xs">#{i + 1} {acc.name || "Unknown Suspect"}</p>
                        {acc.phone && <p className="text-[11px] text-slate-600">Phone: {acc.phone}</p>}
                        {acc.address && <p className="text-[11px] text-slate-600">Address: {acc.address}</p>}
                        {acc.relationWithComplainant && (
                          <p className="text-[11px] text-slate-500">Relation: {acc.relationWithComplainant}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No named accused found in this evidence docket.</p>
                )}
              </div>

              {/* Incident Facts */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Occurrence & Incident Facts</span>
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Place of Occurrence</label>
                    <input
                      type="text"
                      value={editIncidentPlace}
                      onChange={(e) => setEditIncidentPlace(e.target.value)}
                      placeholder="e.g. Near Bus Stand, Sector 10"
                      className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Incident Date & Time</label>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                      {record.structuredData?.incident?.date || "Date not specified"} • {record.structuredData?.incident?.time || "Time not specified"}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Concise Allegation Summary</label>
                    <textarea
                      rows={3}
                      value={editIncidentSummary}
                      onChange={(e) => setEditIncidentSummary(e.target.value)}
                      placeholder="Concise summary of facts mentioned in this document..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-slate-900 bg-white leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Legal Sections & Property Entities */}
              {((record.structuredData?.legalSections && record.structuredData.legalSections.length > 0) ||
                (record.structuredData?.vehicles && record.structuredData.vehicles.length > 0) ||
                (record.structuredData?.properties && record.structuredData.properties.length > 0)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {record.structuredData?.legalSections && record.structuredData.legalSections.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Scale className="w-4 h-4 text-indigo-600" />
                        <span>Statutory Sections Detected</span>
                      </h4>
                      <div className="space-y-1.5">
                        {record.structuredData.legalSections.map((sec, i) => (
                          <div key={i} className="p-2 bg-indigo-50/50 rounded border border-indigo-200">
                            <p className="font-bold text-indigo-900">{sec.act}: {sec.section}</p>
                            {sec.description && <p className="text-[10px] text-indigo-700">{sec.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {record.structuredData?.vehicles && record.structuredData.vehicles.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Car className="w-4 h-4 text-blue-600" />
                        <span>Vehicles Identified</span>
                      </h4>
                      <div className="space-y-1.5">
                        {record.structuredData.vehicles.map((v, i) => (
                          <div key={i} className="p-2 bg-blue-50/50 rounded border border-blue-200">
                            <p className="font-bold text-blue-900">{v.regNumber} ({v.makeModel || "Vehicle"})</p>
                            <p className="text-[10px] text-blue-700">Owner: {v.ownerName || "Unknown"} • Status: {v.involvement}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Human Verification Box */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-purple-950 flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Officer Verification & Audit Stamp</span>
                  </h4>
                  <span className="text-[11px] font-mono text-purple-800">
                    Status: {record.verificationStatus}
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-purple-900 block mb-1">
                    Verification Remarks / Case Docket Reference
                  </label>
                  <input
                    type="text"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="e.g. Verified against original physical complaint sheet submitted at PS."
                    className="w-full rounded-lg border border-purple-300 p-2 text-slate-900 bg-white"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] text-purple-800">
                    Reviewing Officer: <strong>{currentOfficerName}</strong> ({currentOfficerRole})
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isVerifying}
                    onClick={handleVerify}
                    className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save & Mark Human-Verified</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "raw_text" && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Verbatim Extracted Text (OCR / Parser Output)</h4>
                  <p className="text-[11px] text-slate-500">
                    Language: <strong>{record.detectedLanguage}</strong> • Preserved permanently without alteration
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(record.extractedText);
                    setSuccessToast("Extracted text copied to clipboard!");
                    setTimeout(() => setSuccessToast(null), 2500);
                  }}
                  className="text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copy Text</span>
                </Button>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
                {record.extractedText || "No raw text was extracted from this file."}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-xs">Immutable Audit History & Timeline</h4>
                <p className="text-[11px] text-slate-500">
                  Every processing stage, review edit, and document generation reuse is logged with timestamp.
                </p>
              </div>
              <div className="space-y-2">
                {(record.auditTrail || []).map((audit, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-xs">
                          {audit.action.replace(/_/g, " ")}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(audit.timestamp).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">{audit.details}</p>
                      <p className="text-[11px] text-slate-500">
                        Officer: <strong className="text-slate-800">{audit.performedBy}</strong> {audit.performedByRole ? `(${audit.performedByRole})` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <div>
            {isFailed && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isRetrying}
                onClick={handleRetry}
                className="text-xs font-semibold gap-1.5 text-red-700 border-red-300 hover:bg-red-50 cursor-pointer"
              >
                {isRetrying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Retry Processing Job</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
