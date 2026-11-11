"use client";

// src/app/telecom/page.tsx
// Comprehensive Haryana Police Telecom Evidence & Forensic Investigation Workspace (Phase 4)
// Investigation Quality Control, AI Evidence Verification & Court-Ready Digital Forensics

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useGuardedRouter as useRouter } from "@/hooks/useGuardedRouter";
import Link from "next/link";
import { TelecomResultsTable } from "@/components/telecom/TelecomResultsTable";
import { CommunicationGapsPanel } from "@/components/telecom/CommunicationGapsPanel";
import { EvidenceAnalysisPanel } from "@/components/telecom/EvidenceAnalysisPanel";
import { CallAnalysisPanel } from "@/components/telecom/CallAnalysisPanel";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Shield,
  Clock,
  Calendar,
  MapPin,
  Database,
  Sparkles,
  Filter,
  Search,
  Download,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Radio,
  Network,
  BarChart3,
  Users,
  RefreshCw,
  UploadCloud,
  Smartphone,
  CheckSquare,
  FileSearch,
  Eye,
  SlidersHorizontal,
  Lock,
  Archive,
  Briefcase,
  Share2,
  Move,
  Plus,
  Trash2,
  Edit3,
  MessageSquare,
  ChevronRight,
  Check,
  X,
  FileCheck2,
  Printer,
  FileSpreadsheet,
  Split,
  GitMerge,
  History,
  RotateCcw,
  HelpCircle,
  FolderLock,
  Scale,
  Award,
  BookOpen,
  UserCheck,
  FileCode,
  ShieldCheck,
  Zap,
  Binary
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  TelecomEvidenceFile,
  CdrStatistics,
  CrossFirMatch,
  NormalizedTowerRecord,
  SavedAnalysisFinding,
  DataQualityReport,
  ActivitySpike,
  StatementConsistencyResult,
  FirstLastContactResult,
  CommunicationGap,
  ReciprocalAnalysis,
  TelecomCategory,
  TelecomOperator,
  ReconciliationDashboardSummary,
  ContactAlias,
  EvidenceCompletenessAssessment,
  TelecomEvidenceRequest,
  UnifiedTimelineEvent,
  BeforeAfterComparison,
  EvidenceReviewChecklistItem,
  AiQueryPlan,
  EvidenceComparisonFactItem,
  CustomTableLayout,
  InvestigationNote,
  InvestigationBoard,
  InvestigationBoardCard,
  InvestigationBoardConnection,
  SavedAnalysisView,
  SupervisorReviewWorkflow,
  InvestigationHandoverRecord,
  ReportVersion,
  OfflineEvidencePackage,
  DataRetentionPolicy,
  InvestigationHypothesis,
  AlternativeExplanation,
  SourceReliabilityScore,
  AnalysisReproductionRun,
  EvidenceIndexItem,
  CourtExhibitPackage,
  AiContradictionItem,
  AiAnalysisVerificationClaim,
  EvidenceReviewQuestion,
  ReportValidationIssue,
  ElectronicEvidenceCertificate,
  EvidenceDisclosureRecord,
  CourtQueryResponse,
  TwoPersonApproval,
  KnowledgeBaseArticle,
  AnalysisMethodDefinition,
  QualityControlChecklistState,
} from "@/types/telecom";

export default function TelecomEvidencePage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "OVERVIEW";
  const initialFirId = searchParams.get("firId") || "ALL";

  const { currentUser } = useAuth();
  const { language, isHindi } = useLanguage();
  const [autoAnalyzing, setAutoAnalyzing] = useState(false);
  const router = useRouter();

  // 9 Core Workspace Navigation Tabs (as required by Phase 4 UI/UX specifications)
  type WorkspaceTab =
    | "OVERVIEW"
    | "TELECOM_ANALYSIS"
    | "TIMELINE"
    | "HYPOTHESIS_WORKSPACE"
    | "EVIDENCE_EXPLORER"
    | "AI_VERIFICATION"
    | "QUALITY_CONTROL"
    | "COURT_REPORTS"
    | "AUDIT_ADMIN";

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    const valid: WorkspaceTab[] = [
      "OVERVIEW", "TELECOM_ANALYSIS", "TIMELINE", "HYPOTHESIS_WORKSPACE",
      "EVIDENCE_EXPLORER", "AI_VERIFICATION", "QUALITY_CONTROL",
      "COURT_REPORTS", "AUDIT_ADMIN"
    ];
    return valid.includes(initialTab as any) ? (initialTab as WorkspaceTab) : "OVERVIEW";
  });

  const [selectedFirId, setSelectedFirId] = useState<string>(initialFirId);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Core Data State
  const [files, setFiles] = useState<TelecomEvidenceFile[]>([]);
  const [stats, setStats] = useState<CdrStatistics | null>(null);
  const [crossMatches, setCrossMatches] = useState<CrossFirMatch[]>([]);
  const [dataQuality, setDataQuality] = useState<DataQualityReport | null>(null);
  const [activitySpikes, setActivitySpikes] = useState<ActivitySpike[]>([]);
  const [towers, setTowers] = useState<NormalizedTowerRecord[]>([]);
  const [availableFirs, setAvailableFirs] = useState<any[]>([]);
  const [savedFindings, setSavedFindings] = useState<SavedAnalysisFinding[]>([]);
  const [contactAliases, setContactAliases] = useState<ContactAlias[]>([]);
  const [evidenceRequests, setEvidenceRequests] = useState<TelecomEvidenceRequest[]>([]);
  const [unifiedTimeline, setUnifiedTimeline] = useState<UnifiedTimelineEvent[]>([]);
  const [beforeAfter, setBeforeAfter] = useState<BeforeAfterComparison | null>(null);
  const [completeness, setCompleteness] = useState<EvidenceCompletenessAssessment | null>(null);

  // Phase 4 Forensic Intelligence State
  const [hypotheses, setHypotheses] = useState<InvestigationHypothesis[]>([]);
  const [alternativeExpls, setAlternativeExpls] = useState<AlternativeExplanation[]>([]);
  const [sourceReliability, setSourceReliability] = useState<SourceReliabilityScore[]>([]);
  const [evidenceIndex, setEvidenceIndex] = useState<EvidenceIndexItem[]>([]);
  const [courtExhibits, setCourtExhibits] = useState<CourtExhibitPackage[]>([]);
  const [aiContradictions, setAiContradictions] = useState<AiContradictionItem[]>([]);
  const [aiVerifications, setAiVerifications] = useState<AiAnalysisVerificationClaim[]>([]);
  const [reviewQuestions, setReviewQuestions] = useState<EvidenceReviewQuestion[]>([]);
  const [reportValidationIssues, setReportValidationIssues] = useState<ReportValidationIssue[]>([]);
  const [evidenceCertificates, setEvidenceCertificates] = useState<ElectronicEvidenceCertificate[]>([]);
  const [disclosureLogs, setDisclosureLogs] = useState<EvidenceDisclosureRecord[]>([]);
  const [courtQueries, setCourtQueries] = useState<CourtQueryResponse[]>([]);
  const [dualApprovals, setDualApprovals] = useState<TwoPersonApproval[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseArticle[]>([]);
  const [methodRegistry, setMethodRegistry] = useState<AnalysisMethodDefinition[]>([]);
  const [qcDashboard, setQcDashboard] = useState<QualityControlChecklistState | null>(null);
  const [retentionPolicy, setRetentionPolicy] = useState<DataRetentionPolicy | null>(null);

  // Sub-tabs in Section 2: Telecom Analysis
  const [telecomSubTab, setTelecomSubTab] = useState<
    "CALL_INTEL" | "TOWER_MASTER" | "SIM_IMEI_MNP" | "CDR_IPDR_CONSISTENCY" | "RECONCILIATION"
  >("CALL_INTEL");

  // Call Intel Inner Sub-tabs
  const [callIntelSubTab, setCallIntelSubTab] = useState<
    "CONTACTS" | "FIRST_LAST" | "GAPS" | "SPIKES" | "RECIPROCAL" | "SHORT_CALLS"
  >("CONTACTS");
  const [firstLastNumA, setFirstLastNumA] = useState("");
  const [firstLastNumB, setFirstLastNumB] = useState("");
  const [firstLastResult, setFirstLastResult] = useState<FirstLastContactResult | null>(null);
  const [loadingFirstLast, setLoadingFirstLast] = useState(false);
  const [firstLastContacts, setFirstLastContacts] = useState<{firId:string; contacts:Record<string,string[]>} | null>(null);
  const [firstLastMessage, setFirstLastMessage] = useState("");
  const firstLastRequest = useRef<AbortController | null>(null);
  const telecomLoadGeneration = useRef(0);
  const contactMap = firstLastContacts?.firId === selectedFirId ? firstLastContacts.contacts : {};
  const targetOptions = Object.keys(contactMap).sort();
  const partyOptions = Object.hasOwn(contactMap,firstLastNumA) ? contactMap[firstLastNumA] : [];

  function selectTelecomFir(firId:string) {
    if (firId === selectedFirId) return;
    telecomLoadGeneration.current++;
    firstLastRequest.current?.abort();
    setFirstLastNumA("");
    setFirstLastNumB("");
    setFirstLastResult(null);
    setFirstLastMessage("");
    setLoadingFirstLast(false);
    setSelectedFirId(firId);
  }

  const [gapHours, setGapHours] = useState(12);
  const [gapsList, setGapsList] = useState<CommunicationGap[]>([]);
  const [loadingGaps, setLoadingGaps] = useState(false);

  const [reciprocalNumA, setReciprocalNumA] = useState("");
  const [reciprocalNumB, setReciprocalNumB] = useState("");
  const [reciprocalResult, setReciprocalResult] = useState<ReciprocalAnalysis | null>(null);
  const [loadingReciprocal, setLoadingReciprocal] = useState(false);

  const [shortCallsList, setShortCallsList] = useState<any[]>([]);
  const [loadingShortCalls, setLoadingShortCalls] = useState(false);

  // Timeline Slider
  const [beforeAfterWindow, setBeforeAfterWindow] = useState<number>(60);

  // AI NLP Query State
  const [aiQueryInput, setAiQueryInput] = useState("15 October ko raat 9 baje se 12 baje tak outgoing calls dikhao");
  const [aiQueryPlan, setAiQueryPlan] = useState<AiQueryPlan | null>(null);
  const [aiQueryLoading, setAiQueryLoading] = useState(false);

  // Smart Search State
  const [smartSearchInput, setSmartSearchInput] = useState("");
  const [smartSearchResults, setSmartSearchResults] = useState<any>(null);
  const [smartSearchLoading, setSmartSearchLoading] = useState(false);

  // Modals State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isHypothesisModalOpen, setIsHypothesisModalOpen] = useState(false);
  const [isExhibitModalOpen, setIsExhibitModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isCourtQueryModalOpen, setIsCourtQueryModalOpen] = useState(false);
  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false);
  const [isReproduceLoading, setIsReproduceLoading] = useState(false);

  // Form Inputs
  const [hypoTitle, setHypoTitle] = useState("");
  const [hypoDesc, setHypoDesc] = useState("");
  const [hypoNotes, setHypoNotes] = useState("");

  const [exhTitle, setExhTitle] = useState("");
  const [exhDesc, setExhDesc] = useState("");
  const [exhNumber, setExhNumber] = useState("");

  const [certSignatory, setCertSignatory] = useState("");
  const [certDesignation, setCertDesignation] = useState("Authorized Nodal Officer");
  const [certOrg, setCertOrg] = useState("Bharti Airtel Ltd (Haryana Circle)");

  const [cqRef, setCqRef] = useState("");
  const [cqCourt, setCqCourt] = useState("Chief Judicial Magistrate Court, Kurukshetra");
  const [cqText, setCqText] = useState("");
  const [cqDraft, setCqDraft] = useState("");

  const [aliasPhone, setAliasPhone] = useState("");
  const [aliasName, setAliasName] = useState("");

  // Upload Form State
  const [uploadCategory, setUploadCategory] = useState<TelecomCategory>("CDR");
  const [uploadOperator, setUploadOperator] = useState<TelecomOperator>("AIRTEL");
  const [uploadSelectedFile, setUploadSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Active FIR Item
  const activeFir = useMemo(() => {
    if (!selectedFirId || selectedFirId === "ALL") return null;
    return availableFirs.find((f) => f.id === selectedFirId) || null;
  }, [selectedFirId, availableFirs]);

  // Load Main Telecom & Phase 4 Data

  // Execute Automated Evidence Correlation & Multi-Panel Analysis
  const handleRunAutoAnalysis = async () => {
    setAutoAnalyzing(true);
    try {
      const res = await fetch("/api/telecom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run_auto_analysis",
          firId: selectedFirId !== "ALL" ? selectedFirId : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(
          "✓ Auto-Analysis Complete!\n\n" +
          data.summary + "\n\n" +
          (data.aiAnalysis ? "GLM analysis for review\n" + data.aiAnalysis + "\n\n" : data.aiAnalysisError ? data.aiAnalysisError + "\n\n" : "") +
          "• Findings generated: " + data.findingsCreated + "\n" +
          "• Hypotheses formulated: " + data.hypothesesCreated + "\n" +
          "All panels have been updated with synthesized telecom intelligence."
        );
        loadTelecomData();
      } else {
        alert("Auto analysis error: " + (data.error || "Execution failed."));
      }
    } catch (err: any) {
      alert("Failed to run auto-analysis: " + err.message);
    } finally {
      setAutoAnalyzing(false);
    }
  };

  const loadTelecomData = async () => {
    const generation = ++telecomLoadGeneration.current;
    setRefreshing(true);
    try {
      const url = new URL("/api/telecom", window.location.origin);
      if (selectedFirId && selectedFirId !== "ALL") url.searchParams.set("firId", selectedFirId);
      if (searchQuery) url.searchParams.set("targetNumber", searchQuery);
      if (dateFrom) url.searchParams.set("dateFrom", dateFrom);
      if (dateTo) url.searchParams.set("dateTo", dateTo);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (generation !== telecomLoadGeneration.current) return;
        setFiles(data.files || []);
        setStats(data.stats || null);
        setFirstLastContacts({firId:selectedFirId, contacts:data.cdrContacts || {}});
        setCrossMatches(data.crossMatches || []);
        setDataQuality(data.dataQuality || null);
        setActivitySpikes(data.activitySpikes || []);
        setTowers(data.towers || []);
        setAvailableFirs(data.firs || []);
        setSavedFindings(data.savedFindings || []);
        setContactAliases(data.contactAliases || []);
        setEvidenceRequests(data.evidenceRequests || []);
        setUnifiedTimeline(data.unifiedTimeline || []);
        setBeforeAfter(data.beforeAfter || null);
        setCompleteness(data.completeness || null);
        // Phase 4 Collections
        setHypotheses(data.hypotheses || []);
        setAlternativeExpls(data.alternativeExpls || []);
        setSourceReliability(data.sourceReliability || []);
        setEvidenceIndex(data.evidenceIndex || []);
        setCourtExhibits(data.courtExhibits || []);
        setAiContradictions(data.aiContradictions || []);
        setAiVerifications(data.aiVerifications || []);
        setReviewQuestions(data.reviewQuestions || []);
        setReportValidationIssues(data.reportValidationIssues || []);
        setEvidenceCertificates(data.evidenceCertificates || []);
        setDisclosureLogs(data.disclosureLogs || []);
        setCourtQueries(data.courtQueries || []);
        setDualApprovals(data.dualApprovals || []);
        setKnowledgeBase(data.knowledgeBase || []);
        setMethodRegistry(data.methodRegistry || []);
        setQcDashboard(data.qcDashboard || null);
        setRetentionPolicy(data.retentionPolicy || null);
      }
    } catch (err) {
      console.error("Failed to load telecom data:", err);
    } finally {
      if (generation === telecomLoadGeneration.current) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTelecomData();
  }, [selectedFirId]);

  // Handle Smart Search
  const handleSmartSearch = async () => {
    if (!smartSearchInput.trim()) return;
    setSmartSearchLoading(true);
    try {
      const res = await fetch(`/api/telecom?action=smart_search&q=${encodeURIComponent(smartSearchInput)}&firId=${selectedFirId}`);
      if (res.ok) {
        const data = await res.json();
        setSmartSearchResults(data.results);
      }
    } catch (err) {
      console.error("Smart search failed:", err);
    } finally {
      setSmartSearchLoading(false);
    }
  };

  // Handle AI Query
  const handleRunAiQuery = async () => {
    if (!aiQueryInput.trim()) return;
    setAiQueryLoading(true);
    try {
      const res = await fetch("/api/telecom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ai_query",
          queryText: aiQueryInput,
          firId: selectedFirId !== "ALL" ? selectedFirId : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiQueryPlan(data.plan);
      }
    } catch (err) {
      console.error("Failed to run AI query:", err);
    } finally {
      setAiQueryLoading(false);
    }
  };

  // Handle Reproduce Analysis
  const handleReproduceAnalysis = async () => {
    setIsReproduceLoading(true);
    try {
      const res = await fetch("/api/telecom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reproduce_run",
          findingId: savedFindings.find(f => f.reproduction)?.id || savedFindings[0]?.id,
        }),
      });
      const result = await res.json();
      alert(result.error || (result.run?.matched ? "Normalized-record calculation matches the saved baseline. Original file bytes and legal authenticity were not verified." : "Calculation differs from the saved baseline. Review the changed evidence."));
    } catch (err) {
      alert("Reproducibility execution failed");
    } finally {
      setIsReproduceLoading(false);
    }
  };

  // Handle Save Hypothesis
  const handleSaveHypothesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hypoTitle || !hypoDesc) return;
    try {
      const res = await fetch("/api/telecom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hypothesis_save",
          hypothesis: {
            firId: selectedFirId !== "ALL" ? selectedFirId : "fir_1",
            title: hypoTitle,
            description: hypoDesc,
            investigatorNotes: hypoNotes,
            supportingEvidenceRefs: ["tel-file-001", "Tower #12091"],
            alternativeExplanations: ["RF Antenna overlap on highway corridor."],
            reviewStatus: "DRAFT",
          },
        }),
      });
      if (res.ok) {
        setIsHypothesisModalOpen(false);
        setHypoTitle("");
        setHypoDesc("");
        setHypoNotes("");
        loadTelecomData();
      }
    } catch (err) {
      alert("Failed to save hypothesis");
    }
  };

  // Handle Save Exhibit
  const handleSaveExhibit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exhTitle) return;
    try {
      const res = await fetch("/api/telecom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "exhibit_save",
          exhibit: {
            firId: selectedFirId !== "ALL" ? selectedFirId : "fir_1",
            firNumber: activeFir?.firNumber || "FIR/2026/0124",
            exhibitNumber: exhNumber || "Exhibit P-1 (Annexure A-1)",
            title: exhTitle,
            description: exhDesc,
            evidenceIds: files.map((f) => f.id),
            status: "DRAFT",
            bsaCertificateAttached: true,
          },
        }),
      });
      if (res.ok) {
        setIsExhibitModalOpen(false);
        setExhTitle("");
        setExhDesc("");
        loadTelecomData();
      }
    } catch (err) {
      alert("Failed to save court exhibit package");
    }
  };

  // Handle Generate Section 63 BSA Certificate
  const handleGenerateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certSignatory) return;
    try {
      const res = await fetch("/api/telecom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "certificate_generate",
          firId: selectedFirId !== "ALL" ? selectedFirId : "fir_1",
          signatoryName: certSignatory,
          signatoryDesignation: certDesignation,
          signatoryOrganization: certOrg,
          evidenceFileIds: files.map((f) => f.id),
        }),
      });
      if (res.ok) {
        setIsCertificateModalOpen(false);
        alert("Unsigned certificate draft prepared. Source verification and an authorized signature are required.");
        loadTelecomData();
      }
    } catch (err) {
      alert("Failed to generate Section 63 BSA Certificate");
    }
  };

  // Handle Save Court Query
  const handleSaveCourtQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cqRef || !cqText) return;
    try {
      const res = await fetch("/api/telecom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "court_query_save",
          query: {
            firId: selectedFirId !== "ALL" ? selectedFirId : "fir_1",
            queryRef: cqRef,
            courtOrAuthority: cqCourt,
            queryText: cqText,
            draftResponse: cqDraft,
            status: "DRAFT",
          },
        }),
      });
      if (res.ok) {
        setIsCourtQueryModalOpen(false);
        setCqRef("");
        setCqText("");
        setCqDraft("");
        loadTelecomData();
      }
    } catch (err) {
      alert("Failed to save court query response");
    }
  };

  // Handle QC Checklist Item Toggle
  const handleToggleQcItem = async (field: keyof QualityControlChecklistState) => {
    if (!qcDashboard) return;
    const updated = {
      ...qcDashboard,
      [field]: !qcDashboard[field],
    };
    setQcDashboard(updated);
    try {
      await fetch("/api/telecom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "qc_update",
          qc: updated,
        }),
      });
    } catch (err) {
      console.error("Failed to update QC status:", err);
    }
  };

  // Handle Dual Approval Process
  const handleProcessDualApproval = async (targetId: string, actionType: any) => {
    try {
      const res = await fetch("/api/telecom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "dual_approval_process",
          firId: selectedFirId !== "ALL" ? selectedFirId : "fir_1",
          targetId,
          actionType,
        }),
      });
      if (res.ok) {
        alert("Dual Two-Person Verification logged successfully.");
        loadTelecomData();
      }
    } catch (err) {
      alert("Failed to process dual approval");
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadSelectedFile) {
      alert("Please select a file to upload (.xlsx, .csv, .txt)");
      return;
    }
    setUploading(true);
    setUploadProgress("Reading file content...");

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target?.result as string;
          setUploadProgress("Validating SHA-256 hash and normalizing records in secure forensic vault...");

          const res = await fetch("/api/telecom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: uploadSelectedFile.name,
              base64Data,
              category: uploadCategory,
              operator: uploadOperator,
              firId: selectedFirId !== "ALL" ? selectedFirId : undefined,
            }),
          });

          const result = await res.json();
          if (res.ok && result.success) {
            setUploadProgress("✓ Upload complete & saved in FIR documents docket. Processing auto-analysis...");
            // Trigger automatic forensic analysis on upload
            fetch("/api/telecom", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "run_auto_analysis",
                firId: selectedFirId !== "ALL" ? selectedFirId : undefined,
              }),
            }).catch(console.error);
            setTimeout(() => {
              setIsUploadModalOpen(false);
              setUploading(false);
              setUploadSelectedFile(null);
              loadTelecomData();
            }, 800);
          } else {
            alert(result.error || "File processing failed.");
            setUploading(false);
          }
        } catch (err: any) {
          alert("Error uploading file: " + err.message);
          setUploading(false);
        }
      };
      reader.readAsDataURL(uploadSelectedFile);
    } catch (err: any) {
      alert("File read error: " + err.message);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header / Context Banner */}
      <div className="bg-[#0b192c] text-white border-b border-slate-800 px-4 sm:px-6 py-3.5 shadow-sm">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight !text-white text-white">
                Telecom Evidence Analysis Workspace
              </h1>
            </div>
          </div>

          {/* FIR Filter & Main Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white/10 rounded-lg p-1 border border-white/15">
              <span className="text-[11px] font-bold text-white px-2">FIR Context:</span>
              <select
                value={selectedFirId}
                onChange={(e) => selectTelecomFir(e.target.value)}
                className="bg-transparent text-white text-xs font-bold py-1 px-2 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Portal FIRs (Cross-Case)</option>
                {availableFirs.map((f) => (
                  <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                    {f.firNumber} — {f.policeStation}
                  </option>
                ))}
              </select>
            </div>

            <Button
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs gap-1.5 shadow-xs cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Records</span>
            </Button>

            <Button
              size="sm"
              onClick={handleRunAutoAnalysis}
              disabled={autoAnalyzing || refreshing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer border border-indigo-400/40"
              title="Execute full automated correlation analysis across all records"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-300 ${autoAnalyzing ? "animate-pulse" : ""}`} />
              <span>{autoAnalyzing ? "Analyzing..." : "Auto Analysis"}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={loadTelecomData}
              disabled={refreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Active FIR Metadata Strip */}
        {activeFir && (
          <div className="w-full mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-[11px]">
            <div>
              <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider">Active FIR</span>
              <span className="font-mono font-bold text-amber-300 text-xs">{activeFir.firNumber}</span>
            </div>
            <div>
              <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider">Police Station</span>
              <span className="font-semibold text-white text-xs">{activeFir.policeStation}</span>
            </div>
            <div>
              <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider">Investigating Officer</span>
              <span className="font-semibold text-white text-xs">{activeFir.assignedIoName || "Assigned IO"}</span>
            </div>
            <div>
              <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider">Evidence Files</span>
              <span className="font-bold text-white text-xs">{files.length} Evidence Files</span>
            </div>
            <div>
              <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider">Court Readiness</span>
              <span className="font-bold text-emerald-300 text-xs">
                {courtExhibits.some(e => e.status === "READY_FOR_COURT" && e.bsaCertificateAttached) ? "Ready for Court" : "Draft Preparation"}
              </span>
            </div>
            <div className="flex items-center justify-end">
              <Link href={`/fir/${activeFir.id}`}>
                <Button size="sm" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-[11px] h-7 px-2 font-bold gap-1 cursor-pointer">
                  Return to FIR <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main 9 Tabs Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
            {[
              { id: "OVERVIEW", label: "Overview", icon: Layers },
              { id: "TELECOM_ANALYSIS", label: "Telecom Analysis", icon: PhoneCall },
              { id: "TIMELINE", label: "Investigation Timeline", icon: Clock },
              { id: "HYPOTHESIS_WORKSPACE", label: "Hypothesis Workspace", icon: HelpCircle },
              { id: "EVIDENCE_EXPLORER", label: "Evidence Explorer", icon: FileSearch },
              { id: "AI_VERIFICATION", label: "AI Verification", icon: Sparkles },
              { id: "QUALITY_CONTROL", label: "Quality Control", icon: ShieldCheck },
              { id: "COURT_REPORTS", label: "Court & Reports", icon: Scale },
              { id: "AUDIT_ADMIN", label: "Audit & Administration", icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#0b192c] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 pt-5">

        {/* ========================================================================= */}
        {/* 1. OVERVIEW TAB */}
        {/* ========================================================================= */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-4">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Calls</span>
                <span className="text-xl font-black text-slate-900">{stats?.totalCalls || 0}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">{files.length} Lawful Files</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Incoming</span>
                <span className="text-xl font-black text-emerald-700">{stats?.incomingCalls || 0}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Calls to Target</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-blue-600 block">Outgoing</span>
                <span className="text-xl font-black text-blue-700">{stats?.outgoingCalls || 0}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Dialed by Target</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-purple-600 block">Unique Contacts</span>
                <span className="text-xl font-black text-purple-700">{stats?.uniqueContactedNumbers || 0}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Separate Parties</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-rose-600 block">Cell Towers</span>
                <span className="text-xl font-black text-rose-700">{towers.length} Sites</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Verified CGI/LAC</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-amber-600 block">Court Exhibits</span>
                <span className="text-xl font-black text-amber-700">{courtExhibits.length} Ready</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Sec 63 BSA Docket</span>
              </div>
            </div>

            {/* Quality Control & Court Readiness Banner */}
            <div className="bg-[#0b192c] text-white rounded-xl p-3 px-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm">Court-Ready Forensic Evidence Docket (Section 63 BSA / Sec 193 BNSS)</h3>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setActiveTab("QUALITY_CONTROL")}
                className="bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs shrink-0 cursor-pointer"
              >
                Inspect Quality Control
              </Button>
            </div>

            {/* Uploaded Evidence Docket Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-3 px-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs uppercase text-slate-800">
                    Uploaded Telecom Records &amp; Source Files ({files.length})
                  </h3>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-[#0b192c] text-white text-xs font-bold gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  Upload Record
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">File Name</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5">Operator</th>
                      <th className="px-3 py-2.5">Records</th>
                      <th className="px-3 py-2.5">SHA-256 Hash</th>
                      <th className="px-3 py-2.5">Uploaded By</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {files.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No telecom source records uploaded yet. Click "Upload Record" above to import CDR, IPDR, CAF, or SDR files.
                        </td>
                      </tr>
                    ) : (
                      files.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-2.5 font-bold text-slate-900 flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{f.originalFilename}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700">
                              {f.category}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-800">{f.operator}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-900">{f.recordCount} rows</td>
                          <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500" title={f.sha256Hash}>
                            {f.sha256Hash.slice(0, 16)}...
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">{f.uploadedBy}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {f.parsingStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TELECOM ANALYSIS TAB */}
        {/* ========================================================================= */}
        {activeTab === "TELECOM_ANALYSIS" && (
          <div className="space-y-4">
            {/* Sub-nav Pill Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-1 shadow-xs">
              {[
                { id: "CALL_INTEL", label: "Call Intelligence (CDR)" },
                { id: "TOWER_MASTER", label: "Tower Master & GIS" },
                { id: "SIM_IMEI_MNP", label: "SIM, IMEI & MNP" },
                { id: "CDR_IPDR_CONSISTENCY", label: "CDR & IPDR Consistency" },
                { id: "RECONCILIATION", label: "Multi-Operator Reconciliation" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setTelecomSubTab(sub.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    telecomSubTab === sub.id
                      ? "bg-[#0b192c] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Sub-tab: CALL INTELLIGENCE */}
            {telecomSubTab === "CALL_INTEL" && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-wrap gap-1">
                  {[
                    { id: "CONTACTS", label: "Top Contacts" },
                    { id: "FIRST_LAST", label: "First & Last Contact" },
                    { id: "GAPS", label: "Communication Gaps" },
                    { id: "SPIKES", label: "Activity Spikes" },
                    { id: "RECIPROCAL", label: "Reciprocal Ratio" },
                    { id: "SHORT_CALLS", label: "Short Calls (<30s)" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setCallIntelSubTab(sub.id as any)}
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        callIntelSubTab === sub.id ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {callIntelSubTab === "CONTACTS" && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase text-slate-800">
                        Contact Ranking &amp; Aggregated Frequency Table
                      </h4>
                    </div>
                    <div className="p-3">
                      <TelecomResultsTable title="Top Contacts" firLabel={activeFir?.firNumber}
                        headers={["Party Number","Subscriber / Verified Alias","Incoming","Outgoing","Total","Duration (sec)","First Contact","Last Contact"]}
                        rows={(stats?.mostFrequentNumbers || []).map(contact=>({
                          key:contact.number,
                          values:[contact.number,contact.subscriberName || "Pending KYC",contact.incoming,contact.outgoing,
                            contact.total,contact.durationSeconds,contact.firstSeen || "—",contact.lastSeen || "—"],
                        }))} />
                    </div>
                  </div>
                )}

                {callIntelSubTab === "GAPS" && (
                  <CommunicationGapsPanel key={selectedFirId} firId={selectedFirId} firLabel={activeFir?.firNumber} contacts={contactMap} />
                )}
                {(callIntelSubTab === "SPIKES" || callIntelSubTab === "RECIPROCAL" || callIntelSubTab === "SHORT_CALLS") && (
                  <CallAnalysisPanel key={selectedFirId+":"+callIntelSubTab} mode={callIntelSubTab} firId={selectedFirId} firLabel={activeFir?.firNumber} contacts={contactMap} />
                )}
                {callIntelSubTab === "FIRST_LAST" && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <h4 className="font-bold text-sm text-slate-900">First &amp; Last Recorded Contact</h4>
                    <datalist id="first-last-cdr-targets">
                      {targetOptions.map(identifier => <option key={identifier} value={identifier} />)}
                    </datalist>
                    <datalist id="first-last-cdr-contacts">
                      {partyOptions.map(identifier => <option key={identifier} value={identifier} />)}
                    </datalist>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        aria-label="Party A"
                        placeholder="Search CDR target"
                        list="first-last-cdr-targets"
                        disabled={!targetOptions.length || loadingFirstLast}
                        value={firstLastNumA}
                        onChange={(e) => { setFirstLastNumA(e.target.value); setFirstLastNumB(""); setFirstLastResult(null); setFirstLastMessage(""); }}
                        className="border border-slate-300 rounded px-3 py-1.5 text-xs font-mono w-44"
                      />
                      <input
                        type="text"
                        aria-label="Party B"
                        placeholder="Search Party B"
                        list="first-last-cdr-contacts"
                        disabled={!partyOptions.length || loadingFirstLast}
                        value={firstLastNumB}
                        onChange={(e) => { setFirstLastNumB(e.target.value); setFirstLastResult(null); setFirstLastMessage(""); }}
                        className="border border-slate-300 rounded px-3 py-1.5 text-xs font-mono w-44"
                      />
                      <Button
                        size="sm"
                        disabled={loadingFirstLast || !targetOptions.includes(firstLastNumA) || !partyOptions.includes(firstLastNumB)}
                        onClick={async () => {
                          const request = new AbortController();
                          firstLastRequest.current?.abort();
                          firstLastRequest.current = request;
                          setLoadingFirstLast(true);
                          setFirstLastResult(null);
                          setFirstLastMessage("");
                          try {
                            const res = await fetch("/api/telecom", {
                              method:"POST", signal:request.signal, headers:{"Content-Type":"application/json"},
                              body:JSON.stringify({action:"save_first_last",numA:firstLastNumA,numB:firstLastNumB,firId:selectedFirId}),
                            });
                            const data = await res.json();
                            if (request.signal.aborted) return;
                            if (!res.ok) throw new Error(data.error || "Contact analysis failed.");
                            setFirstLastResult(data.result ?? null);
                            if (data.finding) {
                              setSavedFindings(current => [data.finding, ...current.filter(f => f.id !== data.finding.id)]);
                              setFirstLastMessage("Analysis saved to this FIR’s telecom findings.");
                            }
                          } catch (error) {
                            if (!request.signal.aborted) setFirstLastMessage(error instanceof Error ? error.message : "Contact analysis failed.");
                          } finally {
                            if (!request.signal.aborted) setLoadingFirstLast(false);
                          }
                        }}
                        className="bg-[#0b192c] text-white text-xs font-bold"
                      >
                        {loadingFirstLast ? "Analyzing…" : "Analyze"}
                      </Button>
                    </div>
                    {firstLastMessage && <p role="status" className="text-xs text-slate-600">{firstLastMessage}</p>}
                    {!targetOptions.length && <p className="text-xs text-slate-600">
                      {refreshing ? "Loading CDR contacts…" : selectedFirId === "ALL" || !selectedFirId
                        ? "Select an FIR to see its CDR contacts."
                        : "No identified CDR targets available for this FIR."}
                    </p>}
                    {!!targetOptions.length && !partyOptions.length && <p className="text-xs text-slate-600">
                      {targetOptions.includes(firstLastNumA) ? "No incoming or outgoing phone numbers found for this target." : "Select a CDR target in Party A to see its contacts."}
                    </p>}
                    {firstLastResult && (
                      <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">First Call</span>
                          <span className="font-mono font-bold text-slate-900">{firstLastResult.firstCallTimestamp || "None"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Call</span>
                          <span className="font-mono font-bold text-slate-900">{firstLastResult.lastCallTimestamp || "None"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Calls</span>
                          <span className="font-bold text-slate-900">{firstLastResult.totalCalls} calls</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                          <span className="font-bold text-slate-900">{Math.round(firstLastResult.totalDurationSeconds / 60)} mins</span>
                        </div>
                      </div>
                    )}
                    {firstLastResult && <TelecomResultsTable title="First and Last Contact Records" firLabel={activeFir?.firNumber}
                      headers={["Time (UTC)","Calling number","Called number","Direction","Duration (sec)"]}
                      rows={firstLastResult.timeline.map(record=>({key:record.id,values:[record.timestamp,record.sourceNumber,
                        record.destinationNumber,record.callType,record.durationSeconds]}))} />}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: TOWER MASTER */}
            {telecomSubTab === "TOWER_MASTER" && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Non-GPS Antenna Sector Disclaimer:</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Cell site coordinates reflect physical mast installation, not precise device GPS. Sector azimuth and radio signal handovers govern coverage boundaries.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 bg-slate-50/70 border-b border-slate-200">
                    <h4 className="font-bold text-xs uppercase text-slate-800">
                      Verified Cell Tower Metadata Master ({towers.length} Sites)
                    </h4>
                  </div>
                  <div className="p-3">
                    <TelecomResultsTable title="Verified Cell Tower Metadata" firLabel={activeFir?.firNumber}
                      headers={["Cell ID / CGI","Site Name","LAC/TAC","Coordinates","Azimuth","RF Uncertainty (m)","Observed Events"]}
                      rows={towers.map(tower=>({key:tower.cellId,values:[tower.cellId,tower.siteName,tower.lac || "N/A",
                        tower.latitude.toFixed(4)+", "+tower.longitude.toFixed(4),tower.azimuth ?? "Omni",
                        tower.uncertaintyRadiusMeters,tower.totalEventsObserved]}))} />
                  </div>
                </div>
              </div>
            )}

            {(telecomSubTab === "SIM_IMEI_MNP" || telecomSubTab === "CDR_IPDR_CONSISTENCY" || telecomSubTab === "RECONCILIATION") && (
              <EvidenceAnalysisPanel key={selectedFirId+":"+telecomSubTab} mode={telecomSubTab} firId={selectedFirId} firLabel={activeFir?.firNumber} files={files} />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. INVESTIGATION TIMELINE TAB */}
        {/* ========================================================================= */}
        {activeTab === "TIMELINE" && (
          <div className="space-y-6">
            {/* Before & After Event Comparison Panel */}
            {beforeAfter && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Before &amp; After Crime Incident Window Activity</h3>
                    <p className="text-xs text-slate-500">
                      Anchor Event: <strong>{beforeAfter.milestoneTitle}</strong> ({beforeAfter.milestoneTimestamp})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Window:</span>
                    {[15, 30, 60, 120].map((w) => (
                      <button
                        key={w}
                        onClick={async () => {
                          setBeforeAfterWindow(w);
                          const res = await fetch(`/api/telecom?action=before_after&windowMinutes=${w}&firId=${selectedFirId}`);
                          const data = await res.json();
                          setBeforeAfter(data.comparison);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-bold ${
                          beforeAfterWindow === w ? "bg-[#0b192c] text-white" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        ±{w}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 space-y-2">
                    <span className="font-bold text-blue-950 uppercase text-[11px] block">
                      Before Incident Window ({beforeAfterWindow} Mins Prior)
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded border border-blue-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Calls</span>
                        <span className="text-base font-black text-blue-900">{beforeAfter.before.callCount}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Duration</span>
                        <span className="text-base font-black text-blue-900">{Math.round(beforeAfter.before.totalDurationSeconds / 60)}m</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Contacts</span>
                        <span className="text-base font-black text-blue-900">{beforeAfter.before.uniqueContacts}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 space-y-2">
                    <span className="font-bold text-amber-950 uppercase text-[11px] block">
                      After Incident Window ({beforeAfterWindow} Mins Subsequent)
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded border border-amber-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Calls</span>
                        <span className="text-base font-black text-amber-900">{beforeAfter.after.callCount}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-amber-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Duration</span>
                        <span className="text-base font-black text-amber-900">{Math.round(beforeAfter.after.totalDurationSeconds / 60)}m</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-amber-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Contacts</span>
                        <span className="text-base font-black text-amber-900">{beforeAfter.after.uniqueContacts}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Unified Chronological Event Stream */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">
                Unified Chronological Timeline ({unifiedTimeline.length} Synced Events)
              </h3>
              <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-4 text-xs">
                {unifiedTimeline.slice(0, 30).map((evt) => (
                  <div key={evt.id} className="relative group">
                    <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                      evt.eventType === "FIR_INCIDENT_MILESTONE" ? "bg-rose-600" :
                      evt.eventType === "CDR_CALL" ? "bg-blue-600" :
                      evt.eventType === "IPDR_SESSION" ? "bg-purple-600" : "bg-amber-600"
                    }`} />
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-500">{evt.eventTime}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                          {evt.sourceType}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 mt-1">{evt.title}</h5>
                      <p className="text-slate-600 text-[11px] mt-0.5">{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. HYPOTHESIS WORKSPACE TAB (Module 1, 2, 14) */}
        {/* ========================================================================= */}
        {activeTab === "HYPOTHESIS_WORKSPACE" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Investigation Hypothesis Workspace &amp; Alternative Interpretations</h3>
                <p className="text-xs text-slate-500">
                  Formulate falsifiable hypotheses with supporting &amp; contradictory evidence without inferring automated guilt
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsHypothesisModalOpen(true)}
                className="bg-[#0b192c] text-white text-xs font-bold gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                New Investigation Hypothesis
              </Button>
            </div>

            {/* Hypotheses Cards */}
            <div className="space-y-4">
              {hypotheses.map((h) => (
                <div key={h.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                          INVESTIGATOR HYPOTHESIS
                        </span>
                        <span className="text-xs font-black text-slate-900">{h.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{h.description}</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded">
                      {h.reviewStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded p-3">
                      <span className="font-bold text-emerald-900 block text-[11px]">Supporting Evidence References:</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-emerald-800">
                        {h.supportingEvidenceRefs.map((ref, idx) => (
                          <li key={idx}>{ref}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-rose-50/60 border border-rose-200 rounded p-3">
                      <span className="font-bold text-rose-900 block text-[11px]">Contradictory / Alibi Evidence:</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-800">
                        {h.contradictoryEvidenceRefs.map((ref, idx) => (
                          <li key={idx}>{ref}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {h.alternativeExplanations && h.alternativeExplanations.length > 0 && (
                    <div className="bg-blue-50/60 border border-blue-200 rounded p-3 text-xs">
                      <span className="font-bold text-blue-950 block text-[11px]">Plausible Alternative Explanations (Analyzer):</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-900">
                        {h.alternativeExplanations.map((alt, idx) => (
                          <li key={idx}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* AI Contradiction Review (Module 14) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200">
                <h4 className="font-bold text-xs uppercase text-slate-800">
                  AI Contradiction Review — Statement Claims vs Radio Data ({aiContradictions.length})
                </h4>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {aiContradictions.map((c) => (
                  <div key={c.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{c.natureOfDiscrepancy}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                        {c.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                        <span className="text-slate-400 font-bold block uppercase text-[10px]">Claim A:</span>
                        <p className="text-slate-800">{c.claimA}</p>
                        <span className="text-[10px] text-slate-500 block mt-1">Source: {c.sourceRefA}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                        <span className="text-slate-400 font-bold block uppercase text-[10px]">Claim B (Evidence):</span>
                        <p className="text-slate-800">{c.claimB}</p>
                        <span className="text-[10px] text-slate-500 block mt-1">Source: {c.sourceRefB}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. EVIDENCE EXPLORER TAB (Module 6, 8, 11, 12) */}
        {/* ========================================================================= */}
        {activeTab === "EVIDENCE_EXPLORER" && (
          <div className="space-y-6">
            {/* Smart Search Bar (Module 8) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Smart Evidence Search (FIR-Wide)</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={smartSearchInput}
                  onChange={(e) => setSmartSearchInput(e.target.value)}
                  placeholder="Search across MSISDN, IMEI, IMSI, Tower Cell ID, IP address, file hash, or alias..."
                  className="flex-1 border border-slate-300 rounded-lg px-3.5 py-2 text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleSmartSearch}
                  disabled={smartSearchLoading}
                  className="bg-[#0b192c] text-white text-xs font-bold px-4"
                >
                  <Search className="w-3.5 h-3.5" />
                  {smartSearchLoading ? "Searching..." : "Search"}
                </Button>
              </div>

              {smartSearchResults && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
                  <span className="font-bold text-slate-900">
                    Results: {smartSearchResults.calls?.length || 0} Calls, {smartSearchResults.towers?.length || 0} Towers, {smartSearchResults.files?.length || 0} Files
                  </span>
                  <div className="divide-y divide-slate-200">
                    {smartSearchResults.calls?.map((c: any) => (
                      <div key={c.id} className="py-1 flex items-center justify-between text-[11px]">
                        <span className="font-mono">{c.sourceNumber} → {c.destinationNumber}</span>
                        <span className="text-slate-500">{c.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Automated Evidence Index (Module 6) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200">
                <h4 className="font-bold text-xs uppercase text-slate-800">
                  Automated Evidence Index Table ({evidenceIndex.length} Artifacts)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Evidence ID</th>
                      <th className="px-3 py-2.5">File Name</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Source Operator</th>
                      <th className="px-3 py-2.5">Acquisition Date</th>
                      <th className="px-3 py-2.5">SHA-256 Hash</th>
                      <th className="px-3 py-2.5">Review Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {evidenceIndex.map((item) => (
                      <tr key={item.evidenceId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{item.evidenceId}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{item.fileName}</td>
                        <td className="px-3 py-2.5 font-mono text-[10px]">{item.evidenceType}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-800">{item.sourceOperator}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">{item.acquisitionDate}</td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{item.sha256Hash.slice(0, 16)}...</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {item.reviewStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Data Lineage Visualization (Module 12) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-xs uppercase text-slate-800">
                End-to-End Data Lineage &amp; Provenance Chain
              </h4>
              <p className="text-xs text-slate-500">
                Traceable pipeline from raw operator spreadsheet to judicial court exhibit
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                {[
                  { step: "1. Raw Operator File", detail: "SHA-256 Hashed Vault" },
                  { step: "2. Parsed Sheets", detail: "Header Column Mapping" },
                  { step: "3. Normalized Records", detail: "IST Standardized Datetime" },
                  { step: "4. Calculations", detail: "Deterministic Parity" },
                  { step: "5. Analysis Finding", detail: "Source-Linked Observation" },
                  { step: "6. Court Exhibit", detail: "Sec 63 BSA Docket" },
                ].map((s, idx) => (
                  <React.Fragment key={idx}>
                    <div className="bg-slate-100 border border-slate-200 rounded p-2.5">
                      <span className="font-bold text-slate-900 block">{s.step}</span>
                      <span className="text-[10px] text-slate-500">{s.detail}</span>
                    </div>
                    {idx < 5 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. AI VERIFICATION TAB (Module 14, 15, 16) */}
        {/* ========================================================================= */}
        {activeTab === "AI_VERIFICATION" && (
          <div className="space-y-6">
            {/* AI Natural Language Query Builder */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">AI Natural Language Forensic Query Builder</h3>
                  <p className="text-xs text-slate-500">Safe, parameterized queries in Hindi &amp; English</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={aiQueryInput}
                  onChange={(e) => setAiQueryInput(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3.5 py-2 text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleRunAiQuery}
                  disabled={aiQueryLoading}
                  className="bg-[#0b192c] text-white text-xs font-bold px-4"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {aiQueryLoading ? "Interpreting..." : "Execute Query"}
                </Button>
              </div>

              {aiQueryPlan && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                  <span className="font-bold text-slate-900">Parameterized Execution Plan:</span>
                  <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                    {aiQueryPlan.filterExplanation}
                  </p>
                  <span className="text-emerald-700 font-bold block text-[11px]">
                    ✓ {aiQueryPlan.matchedRecordCount} records matched in the normalized evidence dataset.
                  </span>
                </div>
              )}
            </div>

            {/* AI Analysis Verification Engine (Module 15) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200">
                <h4 className="font-bold text-xs uppercase text-slate-800">
                  Deterministic AI Analysis Verification Engine ({aiVerifications.length} Claims Checked)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Every numerical claim made by AI is independently recalculated from raw source records
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Claimed Numerical Fact</th>
                      <th className="px-3 py-2.5">Claimed Value</th>
                      <th className="px-3 py-2.5">Deterministic Recalculation</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Formula / Logic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiVerifications.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-medium text-slate-900">{v.claimedFact}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{v.claimedValue}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-emerald-700">{v.recalculatedValue}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {v.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{v.formulaUsed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. QUALITY CONTROL TAB (Module 3, 5, 17, 29) */}
        {/* ========================================================================= */}
        {activeTab === "QUALITY_CONTROL" && (
          <div className="space-y-6">
            {/* QC Dashboard & Interactive Checklist (Module 29) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Investigation Quality Control Center &amp; Pre-Submission Checklist
                  </h3>
                  <p className="text-xs text-slate-500">All checks persist in database and enforce judicial evidentiary standards</p>
                </div>
                <Button
                  size="sm"
                  onClick={handleReproduceAnalysis}
                  disabled={isReproduceLoading}
                  className="bg-[#0b192c] text-white text-xs font-bold gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  {isReproduceLoading ? "Verifying..." : "Re-run Parity Scan"}
                </Button>
              </div>

              {qcDashboard && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {[
                    { key: "originalEvidenceVerified", label: "Original Evidence Sealed & Hashed" },
                    { key: "hashIntegrityChecked", label: "SHA-256 Cryptographic Parity" },
                    { key: "sourceMetadataReviewed", label: "Source Operator & LEAL Reference" },
                    { key: "calculationsReproduced", label: "Analysis Numerically Reproduced" },
                    { key: "findingsSourceLinked", label: "Every Finding Traceable to Raw Rows" },
                    { key: "dataLimitationsDocumented", label: "Non-GPS RF Limitations Disclosed" },
                    { key: "redactionReviewed", label: "Witness Personal Info Redacted" },
                    { key: "supervisorApprovalCompleted", label: "SHO / Supervisory Endorsement" },
                    { key: "courtExhibitPackageChecked", label: "Court Exhibit Manifest Checked" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => handleToggleQcItem(item.key as any)}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        (qcDashboard as any)[item.key]
                          ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="font-bold text-[11px]">{item.label}</span>
                      {(qcDashboard as any)[item.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-300 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Source Reliability Matrix (Module 3) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200">
                <h4 className="font-bold text-xs uppercase text-slate-800">
                  Source Reliability Matrix ({sourceReliability.length} Service Provider Feeds)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Source Operator</th>
                      <th className="px-3 py-2.5">Feed Type</th>
                      <th className="px-3 py-2.5">Acquisition Reference</th>
                      <th className="px-3 py-2.5">Hash Integrity</th>
                      <th className="px-3 py-2.5">Coverage Score</th>
                      <th className="px-3 py-2.5">Timestamp Reliability</th>
                      <th className="px-3 py-2.5">Overall Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sourceReliability.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-bold text-slate-900">{s.operator}</td>
                        <td className="px-3 py-2.5 font-mono text-[10px]">{s.fileType}</td>
                        <td className="px-3 py-2.5 text-slate-700">{s.acquisitionRef}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {s.hashIntegrityStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-800">{s.dateCoverageScore}%</td>
                        <td className="px-3 py-2.5 font-bold text-slate-800">{s.timestampReliabilityScore}%</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900">
                            {s.overallReliability}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 8. COURT & REPORTS TAB (Module 10, 18, 19, 21, 23) */}
        {/* ========================================================================= */}
        {activeTab === "COURT_REPORTS" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Court Exhibit Builder &amp; Section 63 BSA Docket</h3>
                <p className="text-xs text-slate-500">Official court submissions, exhibit numbering and magistrate query responses</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsCertificateModalOpen(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  Sec 63 BSA Certificate
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsExhibitModalOpen(true)}
                  className="bg-[#0b192c] text-white text-xs font-bold gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  New Court Exhibit
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="border-slate-300 text-slate-800 text-xs font-bold gap-1"
                  variant="outline"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print A4 Docket
                </Button>
              </div>
            </div>

            {/* Court Exhibits Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200">
                <h4 className="font-bold text-xs uppercase text-slate-800">
                  Registered Court Exhibits ({courtExhibits.length} Exhibits)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Exhibit / Annexure #</th>
                      <th className="px-3 py-2.5">Title</th>
                      <th className="px-3 py-2.5">Integrity Manifest Hash</th>
                      <th className="px-3 py-2.5">Prepared By</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courtExhibits.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-bold text-slate-900 font-mono">{e.exhibitNumber}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{e.title}</td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{e.manifestHash.slice(0, 16)}...</td>
                        <td className="px-3 py-2.5 text-slate-600">{e.preparedBy}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">{e.preparationDate}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Court Query Response Workspace (Module 23) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Court Query &amp; Clarification Responses</h4>
                  <p className="text-xs text-slate-500">Official judicial clarification responses linked to verified raw records</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsCourtQueryModalOpen(true)}
                  className="bg-[#0b192c] text-white text-xs font-bold gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  Add Court Query
                </Button>
              </div>

              <div className="space-y-3 text-xs">
                {courtQueries.map((q) => (
                  <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{q.queryRef} • {q.courtOrAuthority}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                        {q.status}
                      </span>
                    </div>
                    <p className="text-slate-800 font-semibold">{q.queryText}</p>
                    <div className="bg-white p-2.5 rounded border border-slate-200 mt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Draft Response:</span>
                      <p className="text-slate-700 text-[11px] mt-0.5">{q.draftResponse}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 9. AUDIT & ADMINISTRATION TAB (Module 22, 24, 25, 26, 27, 28) */}
        {/* ========================================================================= */}
        {activeTab === "AUDIT_ADMIN" && (
          <div className="space-y-6">
            {/* Two-Person Dual Approval Panel (Module 24) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900">Two-Person Dual Verification (Sensitive Actions)</h3>
                <p className="text-xs text-slate-500">Mandatory second officer authorization for court packages and sensitive exports</p>
              </div>

              <div className="space-y-2 text-xs">
                {dualApprovals.map((a) => (
                  <div key={a.id} className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{a.actionType}</span>
                      <span className="text-[11px] text-slate-500">
                        1st Approver: {a.firstApprover} • 2nd Approver: {a.secondApprover || "Pending Second Sign-off"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.status === "FULLY_APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                      }`}>
                        {a.status}
                      </span>
                      {a.status === "PENDING_SECOND_APPROVAL" && (
                        <Button
                          size="sm"
                          onClick={() => handleProcessDualApproval(a.targetId, a.actionType)}
                          className="h-6 px-2 text-[10px] bg-slate-900 text-white font-bold"
                        >
                          Sign Second Approval
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Base & Analytical Methods (Module 27 & 28) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                <h4 className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  Investigation Knowledge Base ({knowledgeBase.length})
                </h4>
                <div className="divide-y divide-slate-100 text-xs">
                  {knowledgeBase.map((kb) => (
                    <div key={kb.id} className="py-2.5">
                      <span className="font-bold text-slate-900 block">{kb.title}</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">{kb.content.slice(0, 100)}...</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                <h4 className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-purple-600" />
                  Registered Analytical Methods ({methodRegistry.length})
                </h4>
                <div className="divide-y divide-slate-100 text-xs">
                  {methodRegistry.map((m) => (
                    <div key={m.id} className="py-2.5">
                      <span className="font-bold text-slate-900 block">{m.methodName} (v{m.version})</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">{m.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODALS */}

      {/* 1. UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-300 shadow-2xl overflow-hidden">
            <div className="bg-[#0b192c] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm">Upload Lawful Telecom Records</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-white hover:bg-white/10 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFileUpload} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target FIR (Case Docket):</label>
                <select
                  value={selectedFirId}
                  onChange={(e) => selectTelecomFir(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-semibold bg-slate-50"
                >
                  <option value="ALL">All Portal FIRs (Cross-Case)</option>
                  {availableFirs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firNumber} — {f.policeStation} ({f.complainantName || "Case"})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-0.5">Uploaded evidence will be saved to this FIR's Documents panel automatically.</p>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category:</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                >
                  <option value="CDR">CDR — Call Detail Records</option>
                  <option value="IPDR">IPDR — Internet Protocol Detail Records</option>
                  <option value="TOWER_DUMP">Tower Dump Record</option>
                  <option value="CAF">CAF / SDR Registration Form</option>
                  <option value="MNP">MNP Historical Record</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Operator:</label>
                <select
                  value={uploadOperator}
                  onChange={(e) => setUploadOperator(e.target.value as any)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                >
                  <option value="AIRTEL">Bharti Airtel</option>
                  <option value="JIO">Reliance Jio</option>
                  <option value="VI">Vodafone Idea</option>
                  <option value="BSNL">BSNL</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select File (.xlsx, .csv):</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={(e) => setUploadSelectedFile(e.target.files?.[0] || null)}
                  className="w-full border border-slate-300 rounded p-2 text-xs cursor-pointer"
                />
              </div>
              {uploadProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-blue-900 text-xs">
                  {uploadProgress}
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading} className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black gap-1.5 cursor-pointer">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{uploading ? "Processing..." : "Upload & Auto Analyze"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. HYPOTHESIS MODAL */}
      {isHypothesisModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-300 shadow-2xl overflow-hidden">
            <div className="bg-[#0b192c] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm">Create Investigation Hypothesis</h3>
              <button onClick={() => setIsHypothesisModalOpen(false)} className="text-white hover:bg-white/10 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveHypothesis} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hypothesis Title:</label>
                <input
                  type="text"
                  value={hypoTitle}
                  onChange={(e) => setHypoTitle(e.target.value)}
                  placeholder="e.g. Target Suspect Was Present at Transit Corridor"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description:</label>
                <textarea
                  value={hypoDesc}
                  onChange={(e) => setHypoDesc(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  placeholder="State the investigative interpretation..."
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Investigator Notes &amp; Caveats:</label>
                <textarea
                  value={hypoNotes}
                  onChange={(e) => setHypoNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  placeholder="Limitations and additional verification required..."
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsHypothesisModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#0b192c] text-white text-xs font-bold">
                  Save Hypothesis
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. COURT EXHIBIT MODAL */}
      {isExhibitModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-300 shadow-2xl overflow-hidden">
            <div className="bg-[#0b192c] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm">Register Judicial Court Exhibit Package</h3>
              <button onClick={() => setIsExhibitModalOpen(false)} className="text-white hover:bg-white/10 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveExhibit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Exhibit / Annexure Numbering:</label>
                <input
                  type="text"
                  value={exhNumber}
                  onChange={(e) => setExhNumber(e.target.value)}
                  placeholder="e.g. Exhibit P-1 (Annexure A-1)"
                  className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Exhibit Package Title:</label>
                <input
                  type="text"
                  value={exhTitle}
                  onChange={(e) => setExhTitle(e.target.value)}
                  placeholder="e.g. Certified Call Detail Records with SHA-256 Memo"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description:</label>
                <textarea
                  value={exhDesc}
                  onChange={(e) => setExhDesc(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsExhibitModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#0b192c] text-white text-xs font-bold">
                  Save Exhibit Package
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. SECTION 63 BSA CERTIFICATE MODAL */}
      {isCertificateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-300 shadow-2xl overflow-hidden">
            <div className="bg-[#0b192c] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm">Generate Electronic Evidence Certificate (Sec 63 BSA)</h3>
              <button onClick={() => setIsCertificateModalOpen(false)} className="text-white hover:bg-white/10 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGenerateCertificate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Authorized Signatory Name:</label>
                <input
                  type="text"
                  value={certSignatory}
                  onChange={(e) => setCertSignatory(e.target.value)}
                  placeholder="e.g. Sh. Sandeep Verma"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Designation:</label>
                <input
                  type="text"
                  value={certDesignation}
                  onChange={(e) => setCertDesignation(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Organization / Telecom Operator:</label>
                <input
                  type="text"
                  value={certOrg}
                  onChange={(e) => setCertOrg(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsCertificateModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-700 text-white text-xs font-bold">
                  Generate &amp; Attach Certificate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. COURT QUERY MODAL */}
      {isCourtQueryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-300 shadow-2xl overflow-hidden">
            <div className="bg-[#0b192c] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm">Add Court Clarification Query</h3>
              <button onClick={() => setIsCourtQueryModalOpen(false)} className="text-white hover:bg-white/10 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCourtQuery} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Query Reference Memo / Case #:</label>
                <input
                  type="text"
                  value={cqRef}
                  onChange={(e) => setCqRef(e.target.value)}
                  placeholder="e.g. CJ(JD)/KKR/CR/2026/412"
                  className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Court / Judicial Authority:</label>
                <input
                  type="text"
                  value={cqCourt}
                  onChange={(e) => setCqCourt(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Query Text / Question from Judge:</label>
                <textarea
                  value={cqText}
                  onChange={(e) => setCqText(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Draft Response from IO:</label>
                <textarea
                  value={cqDraft}
                  onChange={(e) => setCqDraft(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                  placeholder="Submit source-backed factual response..."
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsCourtQueryModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#0b192c] text-white text-xs font-bold">
                  Save Court Query
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
