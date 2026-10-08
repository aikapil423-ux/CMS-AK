"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  UserCheck,
  Calendar,
  Clock,
  Phone,
  MapPin,
  User,
  Paperclip,
  FileText,
  Plus,
  Send,
  CheckCircle,
  CheckCircle2,
  Check,
  AlertTriangle,
  Printer,
  Sparkles,
  Link2,
  History as HistoryIcon,
  Scale,
  X,
  UploadCloud,
  Eye,
  RefreshCw,
  Lock,
  Trash2,
  Download,
  Edit3,
  ShieldAlert,
  ArrowRight,
  ScrollText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firService } from "@/services/firService";
import {
  FIRItem,
  FIRCaseDiaryItem,
  FIRDocumentItem,
  ComplaintReportItem,
  FIRTimelineEvent,
  ConfidentialDossierItem,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/state-views";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { FIRReceiptModal } from "@/components/fir/FIRReceiptModal";

type ActiveTab =
  | "overview"
  | "case_diaries"
  | "documents"
  | "summary"
  | "reports"
  | "history"
  | "confidential_dossier";

export default function FIRProfilePage() {
  const params = useParams();
  const router = useRouter();
  const firId = params?.id as string;
  const { currentUser } = useAuth();

  const [fir, setFir] = useState<FIRItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Statutory Receipt Modal
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // IO Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedIoId, setSelectedIoId] = useState("");
  const [assignedDirections, setAssignmentDirections] = useState("");
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);

  // Add Case Diary (Zimni) Modal
  const [isZimniModalOpen, setIsZimniModalOpen] = useState(false);
  const [zimniSummary, setZimniSummary] = useState("");
  const [zimniDetails, setZimniDetails] = useState("");
  const [zimniSubmitting, setZimniSubmitting] = useState(false);

  // Add Document Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("FIELD_REPORT");
  const [docFileName, setDocFileName] = useState("");

  // Final Form (Chargesheet/Closure) Modal
  const [isFinalFormModalOpen, setIsFinalFormModalOpen] = useState(false);
  const [finalFormType, setFinalFormType] = useState<"CHARGESHEET" | "CLOSURE" | "UNTRACED">("CHARGESHEET");
  const [courtName, setCourtName] = useState("Court of CJM, Gurugram");
  const [finalFormSummary, setFinalFormSummary] = useState("");
  const [finalFormSubmitting, setFinalFormSubmitting] = useState(false);

  const isSho = currentUser.role === "SHO" || currentUser.id === "usr_sho_1";
  const isSuperior =
    currentUser.role === "DSP_SUBDIV" ||
    currentUser.role === "SP_DISTRICT" ||
    currentUser.role === "SUPER_ADMIN";
  const isMhc = currentUser.role === "MHC_GD_INCHARGE" || currentUser.role === "DUTY_OFFICER";
  const isIo = currentUser.role === "ENQUIRY_OFFICER" || (!isSho && !isMhc && !isSuperior);

  const fetchFir = () => {
    if (!firId) return;
    setLoading(true);
    try {
      const item = firService.getFirById(firId);
      if (item) {
        setFir(item);
        setSelectedIoId(item.assignedIoId || "");
        setAssignmentDirections(item.assignedDirections || "");
      }
    } catch (e) {
      console.error("Error loading FIR:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFir();
    const unsub = firService.subscribe(() => {
      fetchFir();
    });
    return unsub;
  }, [firId]);

  const handleConfirmAssign = () => {
    if (!fir || !selectedIoId) return;
    const selectedOfficer = MOCK_ENQUIRY_OFFICERS.find((eo) => eo.id === selectedIoId);
    if (!selectedOfficer) return;

    setAssignmentSubmitting(true);
    try {
      firService.assignIo(
        fir.id,
        selectedOfficer.id,
        selectedOfficer.name,
        selectedOfficer.rank,
        assignedDirections,
        currentUser.name
      );
      setIsAssignModalOpen(false);
      fetchFir();
    } catch (err) {
      console.error("Failed to assign IO:", err);
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const handleAddZimni = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fir || !zimniSummary.trim() || !zimniDetails.trim()) return;

    setZimniSubmitting(true);
    try {
      const now = new Date();
      const nextNum = (fir.caseDiaries?.length || 0) + 1;
      const note: FIRCaseDiaryItem = {
        id: `cd-${Date.now()}`,
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().slice(0, 5),
        officer: currentUser.name || "Investigating Officer",
        officerRole: "INVESTIGATING_OFFICER",
        summary: `Zimni No. ${nextNum}: ${zimniSummary}`,
        details: zimniDetails,
        isAutoGenerated: false,
      };

      firService.addCaseDiary(fir.id, note);
      firService.addAuditRecord(
        fir.id,
        "CASE_DIARY_RECORDED",
        `Recorded Zimni No. ${nextNum}: ${zimniSummary}`,
        currentUser.name
      );

      setZimniSummary("");
      setZimniDetails("");
      setIsZimniModalOpen(false);
      fetchFir();
    } catch (err) {
      console.error("Error recording Zimni:", err);
    } finally {
      setZimniSubmitting(false);
    }
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fir || !docTitle.trim()) return;

    const newDoc: FIRDocumentItem = {
      id: `doc-${Date.now()}`,
      title: docTitle,
      fileName: docFileName || `${docTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      category: docCategory as any,
      uploadedBy: currentUser.name || "Officer",
      uploadedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    firService.addDocument(fir.id, newDoc);
    setDocTitle("");
    setDocFileName("");
    setIsDocModalOpen(false);
    fetchFir();
  };

  const handleSubmitFinalForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fir || !finalFormSummary.trim()) return;

    setFinalFormSubmitting(true);
    try {
      firService.submitFinalForm(
        fir.id,
        finalFormType,
        courtName,
        currentUser.name || "IO",
        finalFormSummary
      );
      firService.addAuditRecord(
        fir.id,
        "FINAL_FORM_SUBMITTED",
        `Filed ${finalFormType} report for submission before ${courtName}`,
        currentUser.name
      );
      setIsFinalFormModalOpen(false);
      fetchFir();
    } catch (err) {
      console.error("Failed to submit final form:", err);
    } finally {
      setFinalFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10 space-y-4">
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  if (!fir) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <Scale className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">FIR Record Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested First Information Report could not be located in the register.
        </p>
        <Link href="/fir">
          <Button variant="outline" size="sm" className="text-xs">
            Return to FIR Register
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-50">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/fir">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-slate-500 hover:text-slate-800"
              title="Back to FIR Register"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-red-900">
                {fir.firNumber}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  fir.status === "UNDER_INVESTIGATION"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : fir.status === "CHARGESHEET_FILED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : fir.status === "CLOSURE_REPORT_FILED"
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : "bg-slate-100 text-slate-800 border-slate-200"
                }`}
              >
                {fir.mainStatus || fir.status.replace(/_/g, " ")}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600">
                {fir.cctnsFirNumber || "CCTNS LOCAL"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Registered on {fir.firDate} at {fir.firTime || "10:00"} hrs • {fir.policeStation}, {fir.district}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Statutory Print Modal Button */}
          <Button
            size="sm"
            onClick={() => setIsReceiptOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Statutory FIR Copy
          </Button>

          {/* Assign / Reassign IO */}
          {(isSho || isSuperior) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAssignModalOpen(true)}
              className="border-slate-300 text-slate-700 font-bold text-xs gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              {fir.assignedIoId ? "Reassign IO" : "Assign IO"}
            </Button>
          )}

          {/* Submit Final Form */}
          {fir.status === "UNDER_INVESTIGATION" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFinalFormModalOpen(true)}
              className="border-emerald-300 text-emerald-800 font-bold text-xs gap-1.5 hover:bg-emerald-50"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              File Final Report (Sec 193 BNSS)
            </Button>
          )}
        </div>
      </div>

      {/* Linked Source Complaint Banner (Reciprocal Connection) */}
      {fir.sourceComplaintNumber && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900">
                Connected Origin Complaint: #{fir.sourceComplaintNumber}
              </p>
              <p className="text-[11px] text-blue-700">
                Registered pursuant to SHO recommendation on Complaint docket.
              </p>
            </div>
          </div>
          <Link href={`/complaints/${fir.sourceComplaintId || ""}`}>
            <Button size="sm" variant="outline" className="border-blue-300 text-blue-800 text-xs font-bold gap-1 bg-white hover:bg-blue-100">
              Open Complaint Profile
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { key: "overview", label: "Overview & Facts", icon: FileText },
          { key: "case_diaries", label: `Case Diaries / Zimni (${fir.caseDiaries?.length || 0})`, icon: ScrollText },
          { key: "documents", label: `Documents (${fir.documents?.length || 0})`, icon: Paperclip },
          { key: "summary", label: "Investigation Summary", icon: Sparkles },
          { key: "reports", label: "Final Form / Reports", icon: Scale },
          { key: "history", label: "Timeline & Audit", icon: HistoryIcon },
          { key: "confidential_dossier", label: "Confidential Dossier", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ActiveTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
                isActive
                  ? "bg-[#0b192c] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Acts & Sections Card */}
          <Card className="border-red-200 shadow-xs bg-red-50/30">
            <CardContent className="p-4 flex items-start gap-3">
              <Scale className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-800">
                  Statutory Offence Charged
                </span>
                <h3 className="text-sm font-black text-red-950 font-mono">
                  {fir.actsAndSections}
                </h3>
                <p className="text-xs text-red-800">
                  Major Act: {fir.majorAct || "Bharatiya Nyaya Sanhita, 2023"} • Classification: {fir.categoryDisplay || fir.category}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Complainant Particulars */}
            <Card className="border-slate-200 shadow-xs bg-white">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Complainant / Informant
                  </h3>
                </div>
              </div>
              <CardContent className="p-4 space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold">Name:</span>{" "}
                  <strong className="text-slate-900">{fir.complainantName}</strong>
                  {fir.complainantFatherSpouse && (
                    <span className="text-slate-600"> (S/o, W/o {fir.complainantFatherSpouse})</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Gender / Age:</span>{" "}
                  <span>{fir.complainantGender} / {fir.complainantAge || "Adult"} yrs</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Contact:</span>{" "}
                  <span className="font-mono">{fir.complainantMobile || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Address:</span>{" "}
                  <span>{fir.complainantAddress}, {fir.complainantCity}, {fir.complainantDistrict}</span>
                </div>
              </CardContent>
            </Card>

            {/* Investigating Officer */}
            <Card className="border-slate-200 shadow-xs bg-white">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Investigating Officer (IO)
                  </h3>
                </div>
                {(isSho || isSuperior) && (
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
                  >
                    Change IO
                  </button>
                )}
              </div>
              <CardContent className="p-4 space-y-2 text-xs">
                {fir.assignedIoName ? (
                  <>
                    <div>
                      <span className="text-slate-500 font-semibold">Assigned Officer:</span>{" "}
                      <strong className="text-slate-900">{fir.assignedIoName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">Rank &amp; Belt:</span>{" "}
                      <span>{fir.assignedIoRank || "IO"} ({fir.assignedIoBeltNumber || "—"})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">Phone:</span>{" "}
                      <span className="font-mono">{fir.assignedIoPhone || "—"}</span>
                    </div>
                    {fir.assignedDirections && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-900 mt-2">
                        <span className="font-bold block">SHO Directions:</span>
                        {fir.assignedDirections}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-slate-500">
                    <p>No Investigating Officer assigned yet.</p>
                    {(isSho || isSuperior) && (
                      <Button
                        size="sm"
                        onClick={() => setIsAssignModalOpen(true)}
                        className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      >
                        Assign IO Now
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Occurrence Place & Time */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Occurrence of Offence
              </h3>
            </div>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Date &amp; Time</span>
                <strong className="text-slate-900">
                  {fir.incidentDateFrom} {fir.incidentTimeFrom || ""}
                </strong>
                {fir.incidentDateTo && (
                  <span className="text-slate-500 block text-[11px]">to {fir.incidentDateTo} {fir.incidentTimeTo || ""}</span>
                )}
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-500 font-semibold block">Place of Occurrence</span>
                <strong className="text-slate-900">{fir.incidentPlace}</strong>
                {fir.incidentLandmark && (
                  <span className="text-slate-500 block text-[11px]">Landmark: {fir.incidentLandmark}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Accused Persons */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Accused Details
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {fir.accusedList?.length || 0} Listed
              </span>
            </div>
            <CardContent className="p-4 space-y-2 text-xs">
              {fir.accusedList && fir.accusedList.length > 0 ? (
                fir.accusedList.map((acc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-bold text-slate-900">
                      {idx + 1}. {acc.name} {acc.fatherName ? `(S/o ${acc.fatherName})` : ""}
                    </div>
                    {acc.address && <p className="text-slate-600 mt-0.5">Address: {acc.address}</p>}
                    {acc.physicalDescription && (
                      <p className="text-slate-500 mt-0.5 text-[11px]">Description: {acc.physicalDescription}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">No accused persons specified.</p>
              )}
            </CardContent>
          </Card>

          {/* FIR Substance / Tehreer Content */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Contents of FIR / Tehreer (First Information Substance)
              </h3>
            </div>
            <CardContent className="p-5 text-xs font-serif leading-relaxed text-slate-900 whitespace-pre-wrap">
              {fir.incidentDetails}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. CASE DIARIES / ZIMNI TAB */}
      {activeTab === "case_diaries" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Statutory Case Diaries (Zimni under Section 175 BNSS)
              </h3>
              <p className="text-xs text-slate-500">
                Day-to-day chronological record of investigation, witness examinations, and spot visits.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsZimniModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Zimni Entry
            </Button>
          </div>

          <div className="space-y-3">
            {fir.caseDiaries && fir.caseDiaries.length > 0 ? (
              fir.caseDiaries.map((cd, idx) => (
                <Card key={cd.id || idx} className="border-slate-200 shadow-xs bg-white">
                  <CardContent className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[11px]">
                          Zimni #{fir.caseDiaries!.length - idx}
                        </span>
                        <strong className="text-slate-900">{cd.summary}</strong>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {cd.date} at {cd.time} • {cd.officer}
                      </span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-serif pt-1">
                      {cd.details}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <ScrollText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Case Diaries Recorded Yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click &apos;Add Zimni Entry&apos; to record the first step of investigation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. DOCUMENTS TAB */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Case Files, Memos &amp; Evidentiary Documents
              </h3>
              <p className="text-xs text-slate-500">
                Seizure memos, site plans, Section 180 BNSS witness statements, and medico-legal reports.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsDocModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Upload Document
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fir.documents && fir.documents.length > 0 ? (
              fir.documents.map((doc) => (
                <Card key={doc.id} className="border-slate-200 shadow-xs bg-white">
                  <CardContent className="p-4 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{doc.title}</h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{doc.fileName}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Uploaded by {doc.uploadedBy} on {doc.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => firService.deleteDocument(fir.id, doc.id)}
                      className="text-slate-400 hover:text-red-600 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <Paperclip className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Documents Uploaded</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Upload Tehreer copy, site plans, seizure memos or witness statements.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SUMMARY TAB */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-xs bg-white">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Case Investigation Synopsis
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600">
                Investigation Age: {fir.daysPending || 0} days
              </span>
            </div>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-800 block mb-1">Executive Standing:</span>
                <p className="text-slate-700 leading-relaxed">
                  FIR #{fir.firNumber} is currently <strong>{fir.status.replace(/_/g, " ")}</strong> under{" "}
                  {fir.actsAndSections}. Total {fir.caseDiaries?.length || 0} Case Diary entries (Zimni) recorded
                  and {fir.documents?.length || 0} evidentiary attachments gathered.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-2">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    Investigation Steps Completed
                  </h4>
                  <ul className="list-disc list-inside text-emerald-800 text-[11px] space-y-1">
                    <li>Registration of statutory FIR u/s 173 BNSS</li>
                    <li>Investigating Officer assigned &amp; briefed</li>
                    <li>Crime scene visited and initial Zimni recorded</li>
                    {fir.documents && fir.documents.length > 0 && (
                      <li>{fir.documents.length} evidentiary records submitted</li>
                    )}
                  </ul>
                </div>

                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2">
                  <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    Pending Mandatory Actions
                  </h4>
                  <ul className="list-disc list-inside text-amber-800 text-[11px] space-y-1">
                    <li>Recording of witness statements under Section 180 BNSS</li>
                    <li>Retrieval of CDR / Technical Surveillance where needed</li>
                    <li>Preparation of Final Form (Chargesheet or Closure u/s 193 BNSS)</li>
                    <li>Submission to supervisory review (SHO / DSP)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. REPORTS TAB (Final Form Disposal) */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Final Form Disposal (Police Report under Section 193 BNSS)
              </h3>
              <p className="text-xs text-slate-500">
                Official statutory report submitted to the Magistrate upon completion of investigation.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsFinalFormModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
            >
              <Scale className="w-3.5 h-3.5" />
              Prepare Final Report
            </Button>
          </div>

          {fir.finalFormType ? (
            <Card className="border-emerald-200 bg-emerald-50/30 shadow-xs">
              <CardContent className="p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px]">
                      {fir.finalFormType} FILED
                    </span>
                    <strong className="text-emerald-950 font-mono text-sm">
                      {fir.finalFormNumber}
                    </strong>
                  </div>
                  <span className="text-emerald-800 text-[11px] font-semibold">
                    Date: {fir.finalFormDate}
                  </span>
                </div>
                <div className="p-3 bg-white border border-emerald-200 rounded-lg">
                  <span className="text-slate-500 font-bold block mb-1">Court of Jurisdiction:</span>
                  <p className="text-slate-900 font-semibold">{fir.courtName}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
              <Scale className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Investigation In Progress</p>
              <p className="text-[11px] text-slate-500 mt-1">
                When investigation concludes, the IO will file the Final Report (Chargesheet or Closure) under Sec 193 BNSS.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 6. HISTORY & AUDIT TAB */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Chronological Investigation Timeline &amp; Audit Trail
          </h3>
          <div className="space-y-3">
            {fir.timeline && fir.timeline.length > 0 ? (
              fir.timeline.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3 text-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{evt.title}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{evt.date}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{evt.description}</p>
                    <span className="text-[10px] text-slate-500 mt-1 inline-block">
                      Action By: {evt.actor}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No timeline entries recorded.</p>
            )}
          </div>
        </div>
      )}

      {/* 7. CONFIDENTIAL DOSSIER TAB */}
      {activeTab === "confidential_dossier" && (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <Lock className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">Restricted Supervisory Dossier</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Classified intelligence notes, CDR call detail analyses, suspect movement logs, and confidential source inputs.
          </p>
        </div>
      )}

      {/* Statutory Receipt Modal */}
      {isReceiptOpen && (
        <FIRReceiptModal
          fir={fir}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}

      {/* Assign IO Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Assign Investigating Officer (IO)</h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Select Investigating Officer (IO) *
                </label>
                <select
                  value={selectedIoId}
                  onChange={(e) => setSelectedIoId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">-- Choose Officer --</option>
                  {MOCK_ENQUIRY_OFFICERS.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name} ({officer.rank} • PNO: {officer.pno})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Supervisory Directions (SHO Order)
                </label>
                <textarea
                  rows={3}
                  value={assignedDirections}
                  onChange={(e) => setAssignmentDirections(e.target.value)}
                  placeholder="Directions for IO..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmAssign}
                  disabled={!selectedIoId || assignmentSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  {assignmentSubmitting ? "Assigning..." : "Confirm IO Assignment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Zimni Modal */}
      {isZimniModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Record Case Diary Entry (Zimni u/s 175 BNSS)</h3>
              </div>
              <button
                onClick={() => setIsZimniModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddZimni} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Zimni Title / Subject *
                </label>
                <input
                  type="text"
                  value={zimniSummary}
                  onChange={(e) => setZimniSummary(e.target.value)}
                  placeholder="e.g. Crime Scene Inspection and Site Plan"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Detailed Zimni Content (हस्व जैल कार्यवाही) *
                </label>
                <textarea
                  rows={5}
                  value={zimniDetails}
                  onChange={(e) => setZimniDetails(e.target.value)}
                  placeholder="Record investigation steps, witness statements, memo preparation, and findings..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-serif leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsZimniModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={zimniSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                >
                  {zimniSubmitting ? "Recording..." : "Save Zimni"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Upload Case Document</h3>
              </div>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Site Plan / Naksha Mauka"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Document Category
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="FIELD_REPORT">Site Plan / Field Inspection</option>
                  <option value="COMPLAINT_COPY">Original Tehreer / Complaint Copy</option>
                  <option value="WITNESS_STATEMENT">Witness Statement (Sec 180 BNSS)</option>
                  <option value="MEDICAL_REPORT">Medico-Legal Report (MLR)</option>
                  <option value="FORENSIC_REPORT">Forensic / FSL Report</option>
                  <option value="SEIZURE_MEMO">Seizure Memo / Fard Baramadgi</option>
                  <option value="OTHER">Other Evidentiary Record</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  File Attachment
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setDocFileName(f.name);
                  }}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDocModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Upload Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Final Form Modal */}
      {isFinalFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">File Police Final Report (u/s 193 BNSS)</h3>
              </div>
              <button
                onClick={() => setIsFinalFormModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFinalForm} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Type of Final Disposal *
                </label>
                <select
                  value={finalFormType}
                  onChange={(e) => setFinalFormType(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
                >
                  <option value="CHARGESHEET">Chargesheet / Challan (दोषारोप पत्र)</option>
                  <option value="CLOSURE">Closure Report / Cancellation (खारिजी रिपोर्ट)</option>
                  <option value="UNTRACED">Untraced Report (अदम सुराग)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Court of Judicial Magistrate *
                </label>
                <input
                  type="text"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Final Findings &amp; Grounds (निष्कर्ष) *
                </label>
                <textarea
                  rows={4}
                  value={finalFormSummary}
                  onChange={(e) => setFinalFormSummary(e.target.value)}
                  placeholder="Record summary of evidence established against accused or grounds for closure..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-serif leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFinalFormModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={finalFormSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {finalFormSubmitting ? "Submitting..." : "Submit to Court"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
