"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Trash2,
  Database,
  ArrowRight,
  Sparkles,
  FileCheck,
  RefreshCw,
  X,
  FileCode,
  Shield,
  User,
  MapPin,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  firAutoFillService,
  ProcessedFIRDocumentRecord,
} from "@/services/firAutoFillService";
import { ComplaintService } from "@/services/complaintService";
import { ComplaintItem } from "@/types";

interface FIRUploadAutoFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFirNumber: string;
  targetFirYear: number;
  currentStation?: string;
  currentDistrict?: string;
  onApplyAutoFill: (processedRecord: ProcessedFIRDocumentRecord) => void;
}

export function FIRUploadAutoFillModal({
  isOpen,
  onClose,
  targetFirNumber,
  targetFirYear,
  currentStation,
  currentDistrict,
  onApplyAutoFill,
}: FIRUploadAutoFillModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "raw" | "processed">("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [savedRecord, setSavedRecord] = useState<ProcessedFIRDocumentRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [existingComplaints, setExistingComplaints] = useState<ComplaintItem[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if a record already exists in database for this FIR Number
  useEffect(() => {
    if (isOpen && targetFirNumber) {
      const existing = firAutoFillService.getByFirNumber(targetFirNumber);
      if (existing) {
        setSavedRecord(existing);
        setActiveTab("processed");
      } else {
        setSavedRecord(null);
        setActiveTab("upload");
      }
      loadComplaints();
    }
  }, [isOpen, targetFirNumber]);

  const loadComplaints = async () => {
    try {
      const list = await ComplaintService.getComplaints({});
      if (list && list.length > 0) {
        setExistingComplaints(list.slice(0, 10));
      }
    } catch (err) {
      console.warn("Could not load complaints list", err);
    }
  };

  if (!isOpen) return null;

  // Handle file selection and automated processing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      setProcessingStep("1/4: Reading document & generating raw base64 storage...");
      await new Promise((r) => setTimeout(r, 200));

      setProcessingStep("2/4: Parsing bilingual text & structure...");
      await new Promise((r) => setTimeout(r, 250));

      setProcessingStep("3/4: Extracting Complainant, Accused, Occurrence & Legal Sections...");
      const record = await firAutoFillService.processAndSaveDocument(
        file,
        targetFirNumber,
        targetFirYear,
        currentStation,
        currentDistrict
      );

      setProcessingStep("4/4: Binding to FIR Number and caching in database...");
      await new Promise((r) => setTimeout(r, 200));

      setSavedRecord(record);
      setActiveTab("processed");
    } catch (err: any) {
      console.error("Failed to process document:", err);
      setErrorMsg(err.message || "Failed to process document. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  // Process from existing system complaint
  const handleProcessFromComplaint = async (c: ComplaintItem) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      setProcessingStep("Creating synthetic document from verified complaint record...");
      const docContent = `COMPLAINT NO: ${c.complaintNumber}
DATE: ${c.incidentDate || new Date().toISOString().split("T")[0]}
POLICE STATION: ${c.policeStation || currentStation || "PS City Thanesar"}
DISTRICT: ${c.district || currentDistrict || "Kurukshetra"}

COMPLAINANT / परिवादी:
Name: ${c.complainantName}
Father/Spouse: ${c.complainantFatherSpouse || "Sh. Ramesh Sharma"}
Mobile: ${c.complainantMobile || "9812345670"}
Address: ${c.complainantAddress || "Sector 7, Kurukshetra"}

ACCUSED / आरोपी:
${c.accusedList?.map((a) => `Accused Name: ${a.name}, Address: ${a.address || "Unknown"}`).join("\n") || "Accused is unknown"}

INCIDENT / घटना विवरण:
Place of Incident: ${c.incidentPlace || "Main Market Chowk"}
Date of Occurrence: ${c.incidentDate || new Date().toISOString().split("T")[0]}
Time of Occurrence: ${c.incidentTime || "11:00 AM"}

COMPLAINT FACTS & ALLEGATIONS:
${c.subject || c.incidentDetails || "Written complaint regarding cognizable criminal offence submitted to SHO for registration of FIR under Section 173 BNSS."}`;

      const blob = new Blob([docContent], { type: "text/plain" });
      const file = new File([blob], `${c.complaintNumber}_complaint.txt`, {
        type: "text/plain",
      });

      const record = await firAutoFillService.processAndSaveDocument(
        file,
        targetFirNumber,
        targetFirYear,
        currentStation,
        currentDistrict
      );

      setSavedRecord(record);
      setActiveTab("processed");
    } catch (err: any) {
      setErrorMsg(err.message || "Error processing complaint");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  // Sample quick complaint for instant 1-click test
  const handleLoadSampleDocument = async () => {
    setIsProcessing(true);
    try {
      const sampleText = `सेवा में,
श्रीमान थाना प्रभारी महोदय,
थाना ${currentStation || "PS City Thanesar"}, जिला ${currentDistrict || "Kurukshetra"} (हरियाणा)।

विषय: मोबाइल फोन व नकदी छीनने व मारपीट करने बाबत शिकायत।

महोदय,
सविनय निवेदन यह है कि मैं प्रार्थी विकास शर्मा पुत्र श्री रमेश शर्मा, निवासी मकान नंबर 402, सेक्टर 7, ${currentDistrict || "Kurukshetra"}, मोबाइल नंबर 9812345670 का रहने वाला हूँ।
दिनांक 10/10/2026 को समय करीब दोपहर 01:30 बजे जब मैं मेन मार्केट बस स्टैंड के पास अपनी दुकान की तरफ जा रहा था, तभी एक अज्ञात मोटरसाइकिल सवार व्यक्ति ने आकर मेरे साथ गाली-गलौज व मारपीट की और मेरा सैमसंग मोबाइल फोन व जेब से 8,500 रुपये छीनकर फरार हो गया।

अतः श्रीमान जी से प्रार्थना है कि उक्त अज्ञात आरोपी के खिलाफ सख्त कानूनी कार्रवाई कर मुकदमा दर्ज (FIR) करने की कृपा करें।

प्रार्थी:
विकास शर्मा (Vikas Sharma)
पुत्र श्री रमेश शर्मा
मोबाइल: 9812345670
दिनांक: 10/10/2026`;

      const blob = new Blob([sampleText], { type: "text/plain" });
      const file = new File([blob], "complaint_snatching_market.txt", {
        type: "text/plain",
      });

      const record = await firAutoFillService.processAndSaveDocument(
        file,
        targetFirNumber,
        targetFirYear,
        currentStation,
        currentDistrict
      );

      setSavedRecord(record);
      setActiveTab("processed");
    } catch (err: any) {
      setErrorMsg(err.message || "Error generating sample complaint");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!savedRecord) return;
    onApplyAutoFill(savedRecord);
    onClose();
  };

  const handleClearSaved = () => {
    if (savedRecord) {
      firAutoFillService.delete(savedRecord.id);
      setSavedRecord(null);
      setActiveTab("upload");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Upload &amp; Auto Fill FIR Form
                </h3>
                <span className="bg-blue-100 text-blue-900 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-blue-200">
                  Target: {targetFirNumber}
                </span>
                {savedRecord && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Database className="w-3 h-3" /> Database Cached
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload scanned/digital complaint document. Data is automatically extracted and cached in the database for this FIR.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL TABS */}
        <div className="border-b border-slate-200 px-4 bg-white flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("upload")}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-700 font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            1. Upload &amp; Process Document
          </button>

          <button
            onClick={() => setActiveTab("raw")}
            disabled={!savedRecord}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-all ${
              !savedRecord
                ? "border-transparent text-slate-300 cursor-not-allowed"
                : activeTab === "raw"
                ? "border-blue-600 text-blue-700 font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            2. View Raw Document ({savedRecord ? savedRecord.rawDocument.fileName : "None"})
          </button>

          <button
            onClick={() => setActiveTab("processed")}
            disabled={!savedRecord}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-all ${
              !savedRecord
                ? "border-transparent text-slate-300 cursor-not-allowed"
                : activeTab === "processed"
                ? "border-blue-600 text-blue-700 font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            3. Processed Data (Ready to Auto Fill)
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isProcessing && (
            <div className="my-8 p-6 bg-blue-50 border border-blue-200 rounded-xl text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <div className="font-bold text-sm text-blue-950">
                Processing Document &amp; Saving to Database...
              </div>
              <div className="text-xs text-blue-700 font-mono">
                {processingStep || "Extracting text and identifying entities..."}
              </div>
              <div className="w-48 bg-blue-200 h-1.5 rounded-full mx-auto overflow-hidden">
                <div className="bg-blue-600 h-full w-2/3 animate-pulse"></div>
              </div>
            </div>
          )}

          {/* TAB 1: UPLOAD & PROCESS */}
          {activeTab === "upload" && !isProcessing && (
            <div className="space-y-5">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-xl p-8 text-center cursor-pointer transition-all hover:shadow-xs group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Click to Browse or Drag &amp; Drop Complaint Document
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports scanned PDF, Word (.docx), Plain Text (.txt), or Complaint Photos (PNG/JPG)
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">PDF</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">DOCX</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">JPG/PNG</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">TXT</span>
                </div>
              </div>

              {/* Quick Sample / Test Option */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Quick Demo / Test Complaint</div>
                    <div className="text-[11px] text-slate-500">
                      Process a sample snatching/theft complaint in Hindi &amp; English to test instant auto-fill
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLoadSampleDocument}
                  className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  Load Sample &amp; Auto Fill
                </Button>
              </div>

              {/* Or Select from Existing Registered Complaints */}
              {existingComplaints.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      Or Select from Existing Police Complaints Register
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {existingComplaints.length} complaints available
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {existingComplaints.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleProcessFromComplaint(c)}
                        className="p-2.5 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all flex flex-col justify-between text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono font-bold text-blue-900 text-[11px]">
                            {c.complaintNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {c.incidentDate || "On record"}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 mt-1 line-clamp-1">
                          {c.complainantName}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {c.subject || c.incidentDetails || "General Complaint"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RAW DOCUMENT PREVIEW */}
          {activeTab === "raw" && savedRecord && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Original Raw Document: {savedRecord.rawDocument.fileName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                    <span>Size: {(savedRecord.rawDocument.fileSize / 1024).toFixed(1)} KB</span>
                    <span>Format: {savedRecord.rawDocument.fileType}</span>
                    <span>Uploaded: {new Date(savedRecord.createdAt).toLocaleString("en-IN")}</span>
                    <span className="font-mono text-blue-700 font-bold">Bound to: {savedRecord.relatedFirNumber}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={savedRecord.rawDocument.dataUrl}
                    download={savedRecord.rawDocument.fileName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Raw
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearSaved}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>

              {/* Preview Content */}
              {savedRecord.rawDocument.fileType.startsWith("image/") ? (
                <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center justify-center max-h-[500px] overflow-auto">
                  <img
                    src={savedRecord.rawDocument.dataUrl}
                    alt="Raw Scanned Document"
                    className="max-w-full rounded shadow-xs"
                  />
                </div>
              ) : (
                <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-xs">
                  <div className="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono uppercase font-bold text-slate-700">Verbatim Extracted Content</span>
                    <span>Language: {savedRecord.rawDocument.detectedLanguage}</span>
                  </div>
                  <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto">
                    {savedRecord.rawDocument.rawExtractedText}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROCESSED DATA SUMMARY */}
          {activeTab === "processed" && savedRecord && (
            <div className="space-y-4">
              {/* Header card with database sync indicator */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">
                      Document Successfully Processed &amp; Stored in Database
                    </h5>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Structured data is linked with FIR No. <span className="font-mono font-bold">{savedRecord.relatedFirNumber}</span>. Re-processing is not required on revisit.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Auto Fill Form Now
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* 1. Complainant */}
                <div className="bg-white p-3.5 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Complainant Details (परिवादी विवरण)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Name:</span>{" "}
                    <span className="font-bold text-slate-900">
                      {[savedRecord.processedData.complainant?.firstName, savedRecord.processedData.complainant?.lastName].filter(Boolean).join(" ") || "Not specified in document"}
                    </span>
                  </div>
                  {savedRecord.processedData.complainant?.fatherOrSpouse && (
                    <div>
                      <span className="text-slate-500">Relative:</span>{" "}
                      <span className="font-medium text-slate-800">
                        {savedRecord.processedData.complainant.fatherOrSpouse}
                        {savedRecord.processedData.complainant.relationType ? ` (${savedRecord.processedData.complainant.relationType})` : ""}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Mobile:</span>{" "}
                    <span className="font-mono font-bold text-blue-700">
                      {savedRecord.processedData.complainant?.mobile || "Not specified in document"}
                    </span>
                  </div>
                  {(savedRecord.processedData.complainant?.houseNo || savedRecord.processedData.complainant?.city || savedRecord.processedData.complainant?.state) && (
                    <div>
                      <span className="text-slate-500">Address:</span>{" "}
                      <span className="text-slate-800">
                        {[savedRecord.processedData.complainant?.houseNo, savedRecord.processedData.complainant?.city, savedRecord.processedData.complainant?.state].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Occurrence */}
                <div className="bg-white p-3.5 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>Occurrence Details (घटना स्थल एवं समय)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Place:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {savedRecord.processedData.occurrence?.place || "Not specified in document"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Date:</span>{" "}
                    <span className="font-mono text-slate-800">
                      {savedRecord.processedData.occurrence?.dateFrom || "Not specified in document"}
                    </span>
                  </div>
                  {savedRecord.processedData.occurrence?.timeFrom && (
                    <div>
                      <span className="text-slate-500">Time:</span>{" "}
                      <span className="font-mono text-slate-800">
                        {savedRecord.processedData.occurrence.timeFrom}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Police Station:</span>{" "}
                    <span className="font-semibold text-slate-800">
                      {[savedRecord.processedData.policeStation, savedRecord.processedData.district].filter(Boolean).join(", ") || "Not specified"}
                    </span>
                  </div>
                </div>

                {/* 3. Accused */}
                <div className="bg-white p-3.5 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>Accused Details (आरोपी विवरण)</span>
                  </div>
                  {savedRecord.processedData.accusedList && savedRecord.processedData.accusedList.length > 0 ? (
                    savedRecord.processedData.accusedList.map((acc, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="font-bold text-slate-900">{acc.name}</span>
                        {acc.physicalDescription && <p className="text-[11px] text-slate-500 mt-0.5">{acc.physicalDescription}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic text-[11px]">No specific accused named in document</p>
                  )}
                </div>

                {/* 4. Acts & Sections */}
                <div className="bg-white p-3.5 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                    <Scale className="w-3.5 h-3.5 text-purple-600" />
                    <span>Detected Acts &amp; Sections (धाराएं)</span>
                  </div>
                  <div className="space-y-1">
                    {savedRecord.processedData.actsAndSections && savedRecord.processedData.actsAndSections.length > 0 ? (
                      savedRecord.processedData.actsAndSections.map((as, idx) => (
                        <div key={idx} className="bg-purple-50 p-2 rounded border border-purple-200 text-[11px]">
                          <span className="font-bold text-purple-900">{as.act}</span>:{" "}
                          <span className="font-mono text-purple-800">{as.sections}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic text-[11px]">No specific legal sections detected</p>
                    )}
                  </div>
                </div>
              </div>

              {/* FIR Content Preview */}
              <div className="bg-white p-3.5 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Complaint Body / FIR Content to be Filled</span>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-slate-800 font-mono text-[11px] max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {savedRecord.processedData.firContentText}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {savedRecord ? (
              <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Raw document &amp; processed data saved to database.
              </span>
            ) : (
              <span>Upload document to extract and auto fill FIR fields.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            {savedRecord && (
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Auto Fill FIR Form
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
