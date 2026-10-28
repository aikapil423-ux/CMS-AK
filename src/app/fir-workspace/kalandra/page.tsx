"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FIRWorkspaceNav } from "@/components/fir-workspace/FIRWorkspaceNav";
import { printA4Element } from "@/utils/printElement";
import {
  Gavel,
  FileText,
  Save,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Printer,
  Copy,
  Download,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building2,
  FileCheck2,
  Share2,
  ArrowRight,
  BookOpen,
  Filter,
  Check,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  Send,
  UserCheck
} from "lucide-react";
import {
  KalandraRecord,
  KalandraTemplate,
  KalandraLegalStatus,
  KalandraWorkflowStatus,
  KalandraTypeCode,
  KalandraDocumentPackage,
  KalandraWitness,
  KalandraSupportingDoc
} from "@/types/kalandra";
import { kalandraService, INITIAL_KALANDRA_TEMPLATES } from "@/services/kalandraService";
import { persistentFirService as firService } from "@/services/persistentFirService";
import { ComplaintService } from "@/services/complaintService";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ActiveTab = "templates" | "create" | "drafts" | "prepared" | "manager";

function KalandraWorkspaceContent() {
  const searchParams = useSearchParams();
  const linkedFirId = searchParams.get("firId");

  const [activeTab, setActiveTab] = useState<ActiveTab>("templates");
  const [lang, setLang] = useState<"hi" | "en">("hi");
  const isHi = lang === "hi";

  // Data state
  const [templates, setTemplates] = useState<KalandraTemplate[]>([]);
  const [records, setRecords] = useState<KalandraRecord[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<KalandraTemplate | null>(null);

  // Form State
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<KalandraRecord>>({
    kalandraNumber: "",
    policeStation: "PS City Panipat",
    district: "Panipat",
    caseType: "DIRECT",
    magistrateCourt: "Court of Sub-Divisional Magistrate (SDM), Gurugram",
    incidentDate: new Date().toISOString().split("T")[0],
    incidentTime: "11:00",
    incidentPlace: "",
    respondentName: "",
    respondentFather: "",
    respondentAddress: "",
    respondentAge: "",
    respondentGender: "MALE",
    respondentMobile: "",
    secondPartyName: "",
    secondPartyFather: "",
    secondPartyAddress: "",
    reportingOfficer: "SI Balwan Singh",
    officerRank: "Sub Inspector",
    officerBelt: "1482/GGM",
    factsAndCircumstances: "",
    proposedAction: "",
    remarks: "",
    status: "DRAFT",
    witnesses: [],
    supportingDocuments: []
  });

  // Source linking state for autofill
  const [sourceType, setSourceType] = useState<"DIRECT" | "FIR" | "COMPLAINT" | "GD">("DIRECT");
  const [availableSources, setAvailableSources] = useState<{ id: string; label: string }[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");

  // Search & Filters
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState<"ALL" | "VERIFIED" | "NEEDS_VERIFY">("ALL");
  const [recordSearch, setRecordSearch] = useState("");

  // Document Package Modal
  const [viewingPackage, setViewingPackage] = useState<{
    record: KalandraRecord;
    pkg: KalandraDocumentPackage;
    activeDoc: "main" | "forwarding" | "police" | "witness" | "annexure";
  } | null>(null);

  // Smooth vertical slide / scroll ref for document package
  const docScrollRef = useRef<HTMLDivElement>(null);

  const handleScrollDoc = (direction: "up" | "down") => {
    if (docScrollRef.current) {
      const scrollAmount = direction === "up" ? -350 : 350;
      docScrollRef.current.scrollBy({ top: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (viewingPackage && docScrollRef.current) {
      docScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [viewingPackage?.activeDoc]);

  // Manager New Template State
  const [customTemplateModal, setCustomTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<KalandraTemplate>>({
    code: "CUSTOM_" + Date.now(),
    titleEn: "",
    titleHi: "",
    actEn: "Bharatiya Nagarik Suraksha Sanhita, 2023",
    actHi: "भारतीय नागरिक सुरक्षा संहिता, 2023",
    section: "",
    legalStatus: "VERIFIED_STATUTORY",
    proceduralContext: "",
    defaultCourtEn: "Court of Sub-Divisional Magistrate / Judicial Magistrate",
    defaultCourtHi: "न्यायालय उप-मंडल मजिस्ट्रेट / न्यायिक दंडाधिकारी",
    defaultNarrativeTemplateHi: "",
    defaultNarrativeTemplateEn: "",
    supportingDocumentsList: ["Roznamcha GD Extract", "Spot Memo", "Witness Statements"],
    isApproved: true
  });

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const tmpls = kalandraService.getAllTemplates();
    setTemplates(tmpls);
    const recs = kalandraService.getAllRecords();
    setRecords(recs);
  };

  // If URL has linked firId, auto-select FIR source
  useEffect(() => {
    if (linkedFirId) {
      setSourceType("FIR");
      setSelectedSourceId(linkedFirId);
      handleApplyAutofill("FIR", linkedFirId);
    }
  }, [linkedFirId]);

  // Load source list based on type
  useEffect(() => {
    let isMounted = true;
    async function loadSources() {
      if (sourceType === "FIR") {
        const firs = firService.getAllFirs();
        if (isMounted) {
          setAvailableSources(firs.map((f) => ({ id: f.id, label: `${f.firNumber} - ${f.incidentPlace || ""}` })));
        }
      } else if (sourceType === "COMPLAINT") {
        const comps = await ComplaintService.getComplaints();
        if (isMounted) {
          setAvailableSources(comps.map((c: any) => ({ id: c.id, label: `${c.complaintNumber} - ${c.complainantName}` })));
        }
      } else if (sourceType === "GD") {
        const gds = await GeneralDiaryService.getEntries();
        if (isMounted) {
          setAvailableSources(gds.map((g: any) => ({ id: g.id, label: `${g.gdNumber} - ${g.subject || ""}` })));
        }
      } else {
        if (isMounted) {
          setAvailableSources([]);
        }
      }
    }
    loadSources();
    return () => {
      isMounted = false;
    };
  }, [sourceType]);

  const handleSelectTemplate = (tmpl: KalandraTemplate) => {
    setSelectedTemplate(tmpl);
    setEditingRecordId(null);

    const generatedNumber = kalandraService.generateKalandraNumber();
    const narrativeHi = kalandraService.populateNarrative(tmpl.defaultNarrativeTemplateHi, {
      district: formData.district,
      policeStation: formData.policeStation,
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime
    });
    const narrativeEn = kalandraService.populateNarrative(tmpl.defaultNarrativeTemplateEn, {
      district: formData.district,
      policeStation: formData.policeStation,
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime
    });

    const defaultDocs: KalandraSupportingDoc[] = (tmpl.supportingDocumentsList || []).map((docTitle, i) => ({
      id: `sd-${Date.now()}-${i}`,
      title: docTitle,
      documentType: "SUPPORTING_DOC",
      isAttached: true,
      referenceNumber: ""
    }));

    setFormData((prev) => ({
      ...prev,
      id: "kal-" + Date.now(),
      kalandraNumber: generatedNumber,
      typeCode: tmpl.code,
      templateId: tmpl.id,
      templateTitle: isHi ? tmpl.titleHi : tmpl.titleEn,
      actAndSection: tmpl.section,
      magistrateCourt: isHi ? tmpl.defaultCourtHi : tmpl.defaultCourtEn,
      factsAndCircumstances: isHi ? narrativeHi : narrativeEn,
      proposedAction: isHi
        ? "विपक्षी को नियमानुसार पाबंद/संज्ञान लेकर आवश्यक वैधानिक कार्रवाई अमल में लाई जावे।"
        : "Necessary statutory action and preventive binding down be ordered as per law.",
      witnesses: [
        { id: "w-1", name: "ASI Rakesh Kumar", fatherName: "Sh. Ram Niwas", address: "PS Sector 29, Gurugram", mobile: "" },
        { id: "w-2", name: "", fatherName: "", address: "", mobile: "" }
      ],
      supportingDocuments: defaultDocs,
      status: "DRAFT"
    }));

    setActiveTab("create");
  };

  const handleApplyAutofill = async (type: "FIR" | "COMPLAINT" | "GD", id: string) => {
    if (!id) return;
    const autofilled = await kalandraService.autofillFromSource(type, id);
    if (autofilled) {
      setFormData((prev) => ({
        ...prev,
        ...autofilled
      }));
    }
  };

  const handleSaveDraft = () => {
    if (!formData.respondentName) {
      alert(isHi ? "कृपया गैर-सायल / विपक्षी का नाम दर्ज करें।" : "Please enter the Respondent name.");
      return;
    }

    const recordToSave: KalandraRecord = {
      id: formData.id || "kal-" + Date.now(),
      kalandraNumber: formData.kalandraNumber || kalandraService.generateKalandraNumber(),
      typeCode: formData.typeCode || selectedTemplate?.code || "107_151",
      templateId: formData.templateId || selectedTemplate?.id || "tmpl-107-151",
      templateTitle: formData.templateTitle || selectedTemplate?.titleHi || "Kalandra",
      actAndSection: formData.actAndSection || selectedTemplate?.section || "Sec 107/151 CrPC",
      policeStation: formData.policeStation || "PS City Panipat",
      district: formData.district || "Panipat",
      caseType: formData.caseType || "DIRECT",
      relatedFirId: formData.relatedFirId,
      relatedFirNumber: formData.relatedFirNumber,
      relatedComplaintId: formData.relatedComplaintId,
      relatedComplaintNumber: formData.relatedComplaintNumber,
      relatedGdNumber: formData.relatedGdNumber,
      respondentName: formData.respondentName || "",
      respondentFather: formData.respondentFather,
      respondentAddress: formData.respondentAddress || "",
      respondentAge: formData.respondentAge,
      respondentGender: formData.respondentGender || "MALE",
      respondentMobile: formData.respondentMobile,
      secondPartyName: formData.secondPartyName,
      secondPartyFather: formData.secondPartyFather,
      secondPartyAddress: formData.secondPartyAddress,
      incidentDate: formData.incidentDate || new Date().toISOString().split("T")[0],
      incidentTime: formData.incidentTime,
      incidentPlace: formData.incidentPlace || "",
      reportingOfficer: formData.reportingOfficer || "SI Balwan Singh",
      officerRank: formData.officerRank || "Sub Inspector",
      officerBelt: formData.officerBelt,
      magistrateCourt: formData.magistrateCourt || "Court of Sub-Divisional Magistrate",
      factsAndCircumstances: formData.factsAndCircumstances || "",
      witnesses: formData.witnesses || [],
      supportingDocuments: formData.supportingDocuments || [],
      proposedAction: formData.proposedAction || "",
      remarks: formData.remarks,
      status: "DRAFT",
      language: lang,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    kalandraService.saveRecord(recordToSave);
    refreshData();
    alert(isHi ? "कलंदरा ड्राफ्ट सफलतापूर्वक सहेज लिया गया है!" : "Kalandra draft saved successfully!");
  };

  const handleFinalise = () => {
    if (!formData.respondentName || !formData.incidentPlace || !formData.factsAndCircumstances) {
      alert(
        isHi
          ? "कृपया अनिवार्य विवरण भरें (विपक्षी नाम, घटना स्थल एवं कलंदरा विवरण)!"
          : "Please complete required fields (Respondent name, Occurrence place & Facts)!"
      );
      return;
    }

    const recordToSave: KalandraRecord = {
      id: formData.id || "kal-" + Date.now(),
      kalandraNumber: formData.kalandraNumber || kalandraService.generateKalandraNumber(),
      typeCode: formData.typeCode || selectedTemplate?.code || "107_151",
      templateId: formData.templateId || selectedTemplate?.id || "tmpl-107-151",
      templateTitle: formData.templateTitle || selectedTemplate?.titleHi || "Kalandra",
      actAndSection: formData.actAndSection || selectedTemplate?.section || "Sec 107/151 CrPC",
      policeStation: formData.policeStation || "PS City Panipat",
      district: formData.district || "Panipat",
      caseType: formData.caseType || "DIRECT",
      relatedFirId: formData.relatedFirId,
      relatedFirNumber: formData.relatedFirNumber,
      relatedComplaintId: formData.relatedComplaintId,
      relatedComplaintNumber: formData.relatedComplaintNumber,
      relatedGdNumber: formData.relatedGdNumber,
      respondentName: formData.respondentName || "",
      respondentFather: formData.respondentFather,
      respondentAddress: formData.respondentAddress || "",
      respondentAge: formData.respondentAge,
      respondentGender: formData.respondentGender || "MALE",
      respondentMobile: formData.respondentMobile,
      secondPartyName: formData.secondPartyName,
      secondPartyFather: formData.secondPartyFather,
      secondPartyAddress: formData.secondPartyAddress,
      incidentDate: formData.incidentDate || new Date().toISOString().split("T")[0],
      incidentTime: formData.incidentTime,
      incidentPlace: formData.incidentPlace || "",
      reportingOfficer: formData.reportingOfficer || "SI Balwan Singh",
      officerRank: formData.officerRank || "Sub Inspector",
      officerBelt: formData.officerBelt,
      magistrateCourt: formData.magistrateCourt || "Court of Sub-Divisional Magistrate",
      factsAndCircumstances: formData.factsAndCircumstances || "",
      witnesses: formData.witnesses || [],
      supportingDocuments: formData.supportingDocuments || [],
      proposedAction: formData.proposedAction || "",
      remarks: formData.remarks,
      status: "FINALISED",
      language: lang,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      finalisedAt: new Date().toISOString()
    };

    kalandraService.saveRecord(recordToSave);
    refreshData();
    handleOpenPackage(recordToSave);
  };

  const handleOpenPackage = (record: KalandraRecord) => {
    const pkg = kalandraService.generateKalandraPackage(record, lang);
    setViewingPackage({
      record,
      pkg,
      activeDoc: "main"
    });
  };

  const handlePreviewTemplate = (t: KalandraTemplate) => {
    const sampleRecord: KalandraRecord = {
      id: "preview-" + t.id,
      kalandraNumber: "KAL/PRV/2026",
      caseType: "DIRECT",
      templateId: t.id,
      typeCode: t.code,
      templateTitle: isHi ? t.titleHi : t.titleEn,
      actAndSection: t.section,
      magistrateCourt: isHi ? t.defaultCourtHi : t.defaultCourtEn,
      policeStation: isHi ? "थाना शहर अम्बाला" : "PS City Ambala",
      district: isHi ? "अम्बाला" : "Ambala",
      reportingOfficer: isHi ? "सुरेन्द्र पाल" : "Surender Pal",
      officerRank: isHi ? "सब-इंस्पेक्टर" : "Sub-Inspector",
      officerBelt: "SI/1104",
      respondentName: isHi ? "रमेश कुमार" : "Ramesh Kumar",
      respondentFather: isHi ? "सुरेश चन्द" : "Suresh Chand",
      respondentAge: 38,
      respondentAddress: isHi ? "मकान नं. 42, मेन बाजार, अम्बाला शहर" : "H.No. 42, Main Bazar, Ambala City",
      respondentMobile: "9876543210",
      incidentDate: new Date().toISOString().split("T")[0],
      incidentTime: "11:30 AM",
      incidentPlace: isHi ? "मेन चौक, बाजार क्षेत्र" : "Main Chowk, Bazar Area",
      factsAndCircumstances: kalandraService.populateNarrative(
        (isHi ? t.defaultNarrativeTemplateHi : t.defaultNarrativeTemplateEn) || "",
        {
          district: isHi ? "अम्बाला" : "Ambala",
          incidentDate: new Date().toISOString().split("T")[0],
          incidentTime: "11:30 AM",
          incidentPlace: isHi ? "मेन चौक, बाजार क्षेत्र" : "Main Chowk, Bazar Area",
          respondentName: isHi ? "रमेश कुमार" : "Ramesh Kumar",
          respondentFather: isHi ? "सुरेश चन्द" : "Suresh Chand",
          respondentAddress: isHi ? "मकान नं. 42, मेन बाजार, अम्बाला शहर" : "H.No. 42, Main Bazar, Ambala City",
        }
      ),
      proposedAction: isHi
        ? "विपक्षी को तलब फरमाकर एक वर्ष की अवधि हेतु शांति व्यवस्था बनाए रखने बाबत मुचलका व दो जामिन पाबंद फरमाए जाने का आदेश जारी करने की कृपा करें।"
        : "It is prayed that respondent be summoned and bound down to execute personal bond with sureties for maintaining public peace.",
      witnesses: [
        {
          id: "w1",
          name: isHi ? "संजय शर्मा" : "Sanjay Sharma",
          fatherName: isHi ? "राम लाल" : "Ram Lal",
          address: isHi ? "दुकान नं. 12, मेन बाजार" : "Shop 12, Main Bazar",
          mobile: "9812345678"
        },
        {
          id: "w2",
          name: isHi ? "HC कुलदीप सिंह नं. 452" : "HC Kuldeep Singh No. 452",
          address: isHi ? "थाना शहर अम्बाला" : "PS City Ambala",
          mobile: "9812345679"
        }
      ],
      supportingDocuments: (t.supportingDocumentsList || []).map((doc, idx) => ({
        id: `doc-${idx}`,
        title: doc,
        documentType: "OTHER",
        isAttached: true
      })),
      status: "DRAFT",
      language: lang,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const pkg = kalandraService.generateKalandraPackage(sampleRecord, lang);
    setViewingPackage({
      record: sampleRecord,
      pkg,
      activeDoc: "main"
    });
  };

  const handleEditRecord = (rec: KalandraRecord) => {
    setEditingRecordId(rec.id);
    const tmpl = kalandraService.getTemplateById(rec.templateId) || kalandraService.getTemplateByCode(rec.typeCode);
    if (tmpl) setSelectedTemplate(tmpl);
    setFormData({ ...rec });
    setActiveTab("create");
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm(isHi ? "क्या आप वाकई इस कलंदरा को हटाना चाहते हैं?" : "Are you sure you want to delete this Kalandra?")) {
      kalandraService.deleteRecord(id);
      refreshData();
    }
  };

  const handleAddWitness = () => {
    const newW: KalandraWitness = {
      id: "w-" + Date.now(),
      name: "",
      fatherName: "",
      address: "",
      mobile: ""
    };
    setFormData((prev) => ({
      ...prev,
      witnesses: [...(prev.witnesses || []), newW]
    }));
  };

  const handleRemoveWitness = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      witnesses: (prev.witnesses || []).filter((w) => w.id !== id)
    }));
  };

  const handleUpdateWitness = (id: string, field: keyof KalandraWitness, val: string) => {
    setFormData((prev) => ({
      ...prev,
      witnesses: (prev.witnesses || []).map((w) => (w.id === id ? { ...w, [field]: val } : w))
    }));
  };

  const handleToggleDoc = (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      supportingDocuments: (prev.supportingDocuments || []).map((d) =>
        d.id === docId ? { ...d, isAttached: !d.isAttached } : d
      )
    }));
  };

  const handlePrintDoc = () => {
    if (!viewingPackage) return;
    const title = `KALANDRA_PACKAGE_${viewingPackage.record.kalandraNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    printA4Element("kalandra-complete-dossier-print", title);
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch =
        t.titleHi.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.titleEn.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.section.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.proceduralContext.toLowerCase().includes(templateSearch.toLowerCase());

      if (!matchSearch) return false;
      if (templateFilter === "VERIFIED") return t.legalStatus === "VERIFIED_STATUTORY";
      if (templateFilter === "NEEDS_VERIFY") return t.legalStatus === "NEEDS_LEGAL_MAPPING_VERIFICATION";
      return true;
    });
  }, [templates, templateSearch, templateFilter]);

  // Drafts vs Prepared
  const draftsList = useMemo(() => {
    return records.filter(
      (r) =>
        r.status === "DRAFT" &&
        (r.kalandraNumber.toLowerCase().includes(recordSearch.toLowerCase()) ||
          r.respondentName.toLowerCase().includes(recordSearch.toLowerCase()) ||
          r.actAndSection.toLowerCase().includes(recordSearch.toLowerCase()))
    );
  }, [records, recordSearch]);

  const preparedList = useMemo(() => {
    return records.filter(
      (r) =>
        r.status !== "DRAFT" &&
        (r.kalandraNumber.toLowerCase().includes(recordSearch.toLowerCase()) ||
          r.respondentName.toLowerCase().includes(recordSearch.toLowerCase()) ||
          r.actAndSection.toLowerCase().includes(recordSearch.toLowerCase()))
    );
  }, [records, recordSearch]);

  return (
    <div className="min-h-screen bg-slate-50/70 p-3 sm:p-5 lg:p-6 space-y-4 font-sans">
      {/* Investigation Workspace Navigation */}
      <FIRWorkspaceNav firId={linkedFirId} />

      {/* Minimalist Top Bar: Header, Controls & Tab Navigation */}
      <div className="no-print bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title + Meta */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <Gavel className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {isHi ? "कलंदरा प्रपत्र एवं निवारक कार्यवाही" : "Kalandra & Preventive Proceedings"}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  BNSS / BNS & CrPC
                </span>
                {linkedFirId && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-600" />
                    FIR Linked
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* Right Action: Language toggle + New Kalandra */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setLang("hi")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  lang === "hi" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  lang === "en" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English
              </button>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setSelectedTemplate(templates[0] || null);
                handleSelectTemplate(templates[0]);
              }}
              className="bg-[#0b192c] hover:bg-slate-800 text-white font-semibold text-xs h-8.5 gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isHi ? "नया कलंदरा" : "New Kalandra"}</span>
            </Button>
          </div>
        </div>

        {/* Inner 5 Tabs Navigation: Sleek Segmented Pills */}
        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2.5 overflow-x-auto text-xs touch-pan-x scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "templates"
                ? "bg-[#0b192c] text-white shadow-2xs"
                : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isHi ? "प्रारूप (Templates)" : "Templates"}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "templates" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {templates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "create"
                ? "bg-[#0b192c] text-white shadow-2xs"
                : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            }`}
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{isHi ? "कलंदरा तैयार करें" : "Create / Edit"}</span>
            {selectedTemplate && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800">
                {selectedTemplate.code}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("drafts")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "drafts"
                ? "bg-[#0b192c] text-white shadow-2xs"
                : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isHi ? "ड्राफ्ट्स" : "Drafts"}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "drafts" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {draftsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("prepared")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "prepared"
                ? "bg-[#0b192c] text-white shadow-2xs"
                : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isHi ? "तैयार कलंदरा" : "Prepared"}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "prepared" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {preparedList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manager")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "manager"
                ? "bg-[#0b192c] text-white shadow-2xs"
                : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isHi ? "टेम्पलेट प्रबंधक" : "Template Manager"}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KALANDRA TEMPLATES */}
      {activeTab === "templates" && (
        <div className="space-y-3.5 touch-pan-y overscroll-contain">
          {/* Sleek Search & Filter Toolbar */}
          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={isHi ? "प्रारूप, धारा या कानून खोजें..." : "Search templates, sections, acts..."}
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="w-full h-8.5 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setTemplateFilter("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  templateFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isHi ? "सभी" : "All"} ({templates.length})
              </button>
              <button
                type="button"
                onClick={() => setTemplateFilter("VERIFIED")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  templateFilter === "VERIFIED"
                    ? "bg-white text-emerald-800 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Check className="w-3 h-3 text-emerald-600" />
                {isHi ? "वैधानिक सत्यापित" : "Verified"}
              </button>
              <button
                type="button"
                onClick={() => setTemplateFilter("NEEDS_VERIFY")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  templateFilter === "NEEDS_VERIFY"
                    ? "bg-white text-amber-800 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                {isHi ? "सत्यापन प्रतीक्षित" : "Needs Verification"}
              </button>
            </div>
          </div>

          {/* Minimalist Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 touch-pan-y">
            {filteredTemplates.map((t) => {
              const isNeedsVerify = t.legalStatus === "NEEDS_LEGAL_MAPPING_VERIFICATION";
              return (
                <div
                  key={t.id}
                  className={`bg-white border rounded-xl p-3.5 flex flex-col justify-between transition-all hover:shadow-xs ${
                    isNeedsVerify
                      ? "border-amber-200 hover:border-amber-300"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Status Badge & Code */}
                    <div className="flex items-center justify-between gap-1">
                      {isNeedsVerify ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          {isHi ? "सत्यापन प्रतीक्षित" : "Needs Verification"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          {isHi ? "वैधानिक सत्यापित" : "Verified"}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {t.code}
                      </span>
                    </div>

                    {/* Title & Section */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                        {isHi ? t.titleHi : t.titleEn}
                      </h3>

                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {t.proceduralContext}
                    </p>




                  </div>

                  <div className="pt-3 mt-2 grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handlePreviewTemplate(t)}
                      variant="outline"
                      className="w-full h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 gap-1 rounded-lg cursor-pointer transition-colors"
                      size="sm"
                    >
                      <Eye className="w-3 h-3 text-slate-500" />
                      <span>{isHi ? "पूर्वावलोकन" : "Preview"}</span>
                    </Button>
                    <Button
                      onClick={() => handleSelectTemplate(t)}
                      className="w-full h-8 text-xs font-semibold bg-[#0b192c] hover:bg-slate-800 text-white gap-1 rounded-lg shadow-2xs cursor-pointer transition-colors"
                      size="sm"
                    >
                      <Edit className="w-3 h-3" />
                      <span>{isHi ? "प्रारूप चुनें" : "Use"}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE / EDIT KALANDRA */}
      {activeTab === "create" && (
        <div className="space-y-4">
          {/* Smart Link / Autofill Toolbar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800 text-xs">
                  {isHi ? "स्मार्ट ऑटो-फिल एवं केस सम्बद्धता" : "Autofill & Case Linkage"}
                </span>
              </div>


            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {isHi ? "स्रोत प्रकार (Source Type)" : "Source Type"}
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => {
                    const val = e.target.value as "DIRECT" | "FIR" | "COMPLAINT" | "GD";
                    setSourceType(val);
                    const mappedCaseType: "DIRECT" | "FROM_FIR" | "FROM_COMPLAINT" | "FROM_GD" =
                      val === "FIR"
                        ? "FROM_FIR"
                        : val === "COMPLAINT"
                        ? "FROM_COMPLAINT"
                        : val === "GD"
                        ? "FROM_GD"
                        : "DIRECT";
                    setFormData((p) => ({ ...p, caseType: mappedCaseType }));
                  }}
                  className="w-full h-8.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer"
                >
                  <option value="DIRECT">{isHi ? "प्रत्यक्ष (Direct Kalandra)" : "Direct Kalandra"}</option>
                  <option value="FIR">{isHi ? "FIR से सम्बद्ध (From FIR)" : "From Registered FIR"}</option>
                  <option value="COMPLAINT">{isHi ? "शिकायत से सम्बद्ध (From Complaint)" : "From Complaint"}</option>
                  <option value="GD">{isHi ? "रोजनामचा / GD से सम्बद्ध" : "From Daily Diary (GD)"}</option>
                </select>
              </div>

              {sourceType !== "DIRECT" && (
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    {isHi ? "सम्बद्ध रिकॉर्ड चुनें" : "Select Linked Record"}
                  </label>
                  <select
                    value={selectedSourceId}
                    onChange={(e) => {
                      setSelectedSourceId(e.target.value);
                      handleApplyAutofill(sourceType, e.target.value);
                    }}
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer"
                  >
                    <option value="">{isHi ? "-- रिकॉर्ड चुनें --" : "-- Select Record --"}</option>
                    {availableSources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {isHi ? "कलंदरा प्रारूप (Template)" : "Selected Template"}
                </label>
                <select
                  value={selectedTemplate?.id || ""}
                  onChange={(e) => {
                    const tmpl = templates.find((t) => t.id === e.target.value);
                    if (tmpl) handleSelectTemplate(tmpl);
                  }}
                  className="w-full h-8.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium text-slate-900 cursor-pointer"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code} - {isHi ? t.titleHi : t.titleEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Content Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-5">
            {/* Top Bar inside Form */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                  {formData.kalandraNumber || "KAL/2026/..."}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {formData.templateTitle || (isHi ? "कलंदरा प्रपत्र" : "Kalandra Dossier")}
                </h2>
                <span className="text-xs text-slate-500 font-medium">({formData.actAndSection})</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isHi ? "ड्राफ्ट सहेजें" : "Save Draft"}</span>
                </Button>
                <Button
                  onClick={handleFinalise}
                  size="sm"
                  className="h-8 text-xs font-semibold bg-[#0b192c] hover:bg-slate-800 text-white gap-1.5 shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isHi ? "अंतिम रूप दें एवं दस्तावेज देखें" : "Finalise & Generate"}</span>
                </Button>
              </div>
            </div>

            {/* Section 1: Court, Police Station & Dates */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{isHi ? "1. अधिकार क्षेत्र एवं न्यायालय विवरण" : "1. Jurisdiction & Court Details"}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "न्यायालय (Court / Magistrate)" : "Court of Magistrate"} *
                  </label>
                  <input
                    type="text"
                    value={formData.magistrateCourt || ""}
                    onChange={(e) => setFormData({ ...formData, magistrateCourt: e.target.value })}
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                    placeholder="e.g. Court of Sub-Divisional Magistrate (SDM), Gurugram"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "थाना (Police Station)" : "Police Station"} *
                  </label>
                  <input
                    type="text"
                    value={formData.policeStation || ""}
                    onChange={(e) => setFormData({ ...formData, policeStation: e.target.value })}
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "जिला (District)" : "District"} *
                  </label>
                  <input
                    type="text"
                    value={formData.district || ""}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Parties Information */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>{isHi ? "2. पक्षकार विवरण (Parties / Accused / Respondent)" : "2. Parties Information"}</span>
              </h4>

              {/* Party 1 */}
              <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="font-bold text-xs text-slate-800">
                  {isHi ? "प्रथम पक्ष / गैर-सायल / आरोपी (Party 1 / Respondent)" : "Party 1 / Respondent Details"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {isHi ? "विपक्षी / आरोपी का नाम" : "Respondent Name"} *
                    </label>
                    <input
                      type="text"
                      value={formData.respondentName || ""}
                      onChange={(e) => setFormData({ ...formData, respondentName: e.target.value })}
                      className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                      placeholder="e.g. Suresh Kumar"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {isHi ? "पिता / पति का नाम" : "Father's / Husband's Name"}
                    </label>
                    <input
                      type="text"
                      value={formData.respondentFather || ""}
                      onChange={(e) => setFormData({ ...formData, respondentFather: e.target.value })}
                      className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                      placeholder="e.g. Sh. Ram Kishan"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {isHi ? "मोबाईल नंबर" : "Mobile Number"}
                    </label>
                    <input
                      type="text"
                      value={formData.respondentMobile || ""}
                      onChange={(e) => setFormData({ ...formData, respondentMobile: e.target.value })}
                      className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                      placeholder="98XXXXXXXX"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {isHi ? "पूरा पता (Full Address)" : "Address"} *
                    </label>
                    <input
                      type="text"
                      value={formData.respondentAddress || ""}
                      onChange={(e) => setFormData({ ...formData, respondentAddress: e.target.value })}
                      className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                      placeholder="Village / Sector, City, District"
                    />
                  </div>
                </div>
              </div>

              {/* Second Party */}
              <div className="p-3 bg-slate-50/40 rounded-xl border border-slate-200/60 space-y-2.5">
                <div className="font-semibold text-xs text-slate-700">
                  {isHi ? "द्वितीय पक्ष (यदि लागू हो - विवाद या पीड़ित)" : "Party 2 (If applicable - Complainant / Disputing Party)"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {isHi ? "द्वितीय पक्ष का नाम" : "Party 2 Name"}
                    </label>
                    <input
                      type="text"
                      value={formData.secondPartyName || ""}
                      onChange={(e) => setFormData({ ...formData, secondPartyName: e.target.value })}
                      className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                      placeholder="e.g. Mahesh Yadav"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {isHi ? "पिता का नाम" : "Father's Name"}
                    </label>
                    <input
                      type="text"
                      value={formData.secondPartyFather || ""}
                      onChange={(e) => setFormData({ ...formData, secondPartyFather: e.target.value })}
                      className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {isHi ? "पता" : "Address"}
                    </label>
                    <input
                      type="text"
                      value={formData.secondPartyAddress || ""}
                      onChange={(e) => setFormData({ ...formData, secondPartyAddress: e.target.value })}
                      className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Occurrence & Scene */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{isHi ? "3. घटना स्थल एवं जांच अधिकारी" : "3. Occurrence & Investigating Officer"}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "घटना दिनांक" : "Incident Date"} *
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={formData.incidentDate || ""}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "समय (Time)" : "Incident Time"}
                  </label>
                  <input
                    type="time"
                    value={formData.incidentTime || ""}
                    onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all cursor-pointer"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "घटना स्थल / विवादित संपत्ति विवरण" : "Place of Occurrence / Disputed Property"} *
                  </label>
                  <input
                    type="text"
                    value={formData.incidentPlace || ""}
                    onChange={(e) => setFormData({ ...formData, incidentPlace: e.target.value })}
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                    placeholder="e.g. Main Market Chowk, Sector 29, Gurugram"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "जांच अधिकारी का नाम" : "Investigating Officer"} *
                  </label>
                  <input
                    type="text"
                    value={formData.reportingOfficer || ""}
                    onChange={(e) => setFormData({ ...formData, reportingOfficer: e.target.value })}
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "पद (Rank)" : "Officer Rank"}
                  </label>
                  <input
                    type="text"
                    value={formData.officerRank || ""}
                    onChange={(e) => setFormData({ ...formData, officerRank: e.target.value })}
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "बेल्ट नंबर" : "Belt Number"}
                  </label>
                  <input
                    type="text"
                    value={formData.officerBelt || ""}
                    onChange={(e) => setFormData({ ...formData, officerBelt: e.target.value })}
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "सम्बद्ध GD / रपट संख्या" : "GD / Daily Diary Ref"}
                  </label>
                  <input
                    type="text"
                    value={formData.relatedGdNumber || ""}
                    onChange={(e) => setFormData({ ...formData, relatedGdNumber: e.target.value })}
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                    placeholder="e.g. GD-0038/14-04-2026"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Facts & Narrative */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isHi ? "4. तथ्य एवं परिस्थितियां (कलंदरा आख्या)" : "4. Facts & Narrative Circumstances"} *</span>
                </h4>
                {selectedTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      const templateStr = isHi
                        ? selectedTemplate.defaultNarrativeTemplateHi
                        : selectedTemplate.defaultNarrativeTemplateEn;
                      const pop = kalandraService.populateNarrative(templateStr, formData);
                      setFormData((p) => ({ ...p, factsAndCircumstances: pop }));
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isHi ? "प्रारूप से रीसेट करें" : "Reset from Template"}</span>
                  </button>
                )}
              </div>
              <textarea
                rows={5}
                value={formData.factsAndCircumstances || ""}
                onChange={(e) => setFormData({ ...formData, factsAndCircumstances: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs leading-relaxed bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all font-sans"
                placeholder={isHi ? "घटना का सम्पूर्ण विवरण, अशांति की आशंका एवं साक्ष्य..." : "Complete narrative of facts, apprehension of breach of peace..."}
              />
            </div>

            {/* Section 5: Prayer / Proposed Relief */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5 text-slate-400" />
                <span>{isHi ? "5. प्रार्थना / प्रस्तावित वैधानिक आदेश" : "5. Prayer / Proposed Statutory Order"}</span>
              </h4>
              <textarea
                rows={2}
                value={formData.proposedAction || ""}
                onChange={(e) => setFormData({ ...formData, proposedAction: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                placeholder={isHi ? "e.g. विपक्षी को 1 वर्ष हेतु 50,000/- रुपये का शांति मुचलका व दो स्थानीय जामिन पाबंद फरमाए जावें।" : "Proposed prayer before court..."}
              />
            </div>

            {/* Section 6: Witnesses (गवाहान सूची) */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isHi ? "6. फर्द फेहरिस्त गवाहान (Witnesses)" : "6. Memo of Witnesses"}</span>
                </h4>
                <Button
                  onClick={handleAddWitness}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-semibold gap-1 text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isHi ? "गवाह जोड़ें" : "Add Witness"}</span>
                </Button>
              </div>

              <div className="space-y-1.5">
                {(formData.witnesses || []).map((w, index) => (
                  <div key={w.id} className="p-2 bg-slate-50/60 rounded-lg border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-slate-400 font-bold w-5 text-center text-[11px]">#{index + 1}</span>
                    <input
                      type="text"
                      placeholder={isHi ? "गवाह का नाम" : "Witness Name"}
                      value={w.name}
                      onChange={(e) => handleUpdateWitness(w.id, "name", e.target.value)}
                      className="h-7 px-2 rounded border border-slate-200 bg-white flex-1 min-w-[130px] text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    <input
                      type="text"
                      placeholder={isHi ? "पिता का नाम" : "Father's Name"}
                      value={w.fatherName || ""}
                      onChange={(e) => handleUpdateWitness(w.id, "fatherName", e.target.value)}
                      className="h-7 px-2 rounded border border-slate-200 bg-white flex-1 min-w-[120px] text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    <input
                      type="text"
                      placeholder={isHi ? "निवास पता / पद" : "Address / Designation"}
                      value={w.address}
                      onChange={(e) => handleUpdateWitness(w.id, "address", e.target.value)}
                      className="h-7 px-2 rounded border border-slate-200 bg-white flex-2 min-w-[160px] text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    <input
                      type="text"
                      placeholder={isHi ? "मोबाईल" : "Mobile"}
                      value={w.mobile || ""}
                      onChange={(e) => handleUpdateWitness(w.id, "mobile", e.target.value)}
                      className="h-7 px-2 rounded border border-slate-200 bg-white w-24 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveWitness(w.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 7: Supporting Documents Checklist */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{isHi ? "7. फर्द फेहरिस्त कागजात / संलग्नक (Checklist)" : "7. Supporting Documents Checklist"}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {(formData.supportingDocuments || []).map((doc) => (
                  <label
                    key={doc.id}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                      doc.isAttached
                        ? "bg-emerald-50/40 border-emerald-300 text-emerald-950 font-medium"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={doc.isAttached}
                        onChange={() => handleToggleDoc(doc.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs">{doc.title}</span>
                    </div>
                    {doc.isAttached && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                        {isHi ? "संलग्न" : "Attached"}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Bottom Final Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
              <div className="text-[11px] text-slate-400">
                {isHi ? "सभी फ़ील्ड भरने के बाद अंतिम रूप दें एवं प्रिंट हेतु तैयार करें।" : "Review all sections before finalisation."}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isHi ? "ड्राफ्ट सहेजें" : "Save as Draft"}</span>
                </Button>
                <Button
                  onClick={handleFinalise}
                  size="sm"
                  className="h-8 text-xs font-semibold bg-[#0b192c] hover:bg-slate-800 text-white gap-1.5 shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isHi ? "अंतिम रूप दें एवं दस्तावेज देखें" : "Finalise & Generate Documents"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAVED DRAFTS */}
      {activeTab === "drafts" && (
        <div className="space-y-3.5">
          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={isHi ? "ड्राफ्ट खोजें (कलंदरा सं०, गैर-सायल, धारा)..." : "Search drafts by number, respondent, section..."}
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                className="w-full h-8.5 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {draftsList.length} {isHi ? "ड्राफ्ट" : "drafts"}
            </div>
          </div>

          {draftsList.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              <Save className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700 text-xs sm:text-sm">
                {isHi ? "कोई सहेजा गया ड्राफ्ट नहीं मिला" : "No saved drafts"}
              </h3>
              <p className="text-[11px] mt-1 text-slate-400">
                {isHi ? "नया कलंदरा बनाकर 'ड्राफ्ट सहेजें' पर क्लिक करें।" : "Create a new Kalandra and save it as a draft."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {draftsList.map((rec) => (
                <div key={rec.id} className="border border-slate-200 hover:border-slate-300 transition-all bg-white rounded-xl p-3.5 flex flex-col justify-between space-y-3 shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {rec.kalandraNumber}
                      </span>
                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-semibold px-2 py-0.5 rounded">
                        DRAFT
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{rec.templateTitle}</h4>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">{rec.actAndSection}</div>

                    <div className="mt-2.5 text-xs text-slate-600 space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <strong>{isHi ? "गैर-सायल / आरोपी" : "Respondent"}:</strong> {rec.respondentName}
                      </div>
                      <div>
                        <strong>{isHi ? "स्थान" : "Place"}:</strong> {rec.incidentPlace || "-"}
                      </div>
                      <div>
                        <strong>{isHi ? "जांच अधिकारी" : "IO"}:</strong> {rec.reportingOfficer}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 gap-2">
                    <Button
                      onClick={() => handleDeleteRecord(rec.id)}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs px-2 h-7.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      onClick={() => handleEditRecord(rec)}
                      size="sm"
                      className="h-7.5 bg-[#0b192c] hover:bg-slate-800 text-white font-semibold text-xs gap-1 rounded-lg cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                      <span>{isHi ? "जारी रखें" : "Resume"}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PREPARED KALANDRAS */}
      {activeTab === "prepared" && (
        <div className="space-y-3.5">
          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={isHi ? "तैयार कलंदरा खोजें..." : "Search prepared kalandras..."}
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                className="w-full h-8.5 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {preparedList.length} {isHi ? "कलंदरा" : "records"}
            </div>
          </div>

          {preparedList.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700 text-xs sm:text-sm">
                {isHi ? "कोई अंतिम कलंदरा तैयार नहीं है" : "No finalised Kalandras"}
              </h3>
              <p className="text-[11px] mt-1 text-slate-400">
                {isHi ? "ड्राफ्ट से अंतिम रूप देकर यहां देखें।" : "Finalise a draft to view the completed document package."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {preparedList.map((rec) => (
                <div key={rec.id} className="border border-slate-200 hover:border-slate-300 transition-all bg-white rounded-xl p-3.5 flex flex-col justify-between space-y-3 shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {rec.kalandraNumber}
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {rec.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">{rec.templateTitle}</h4>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                      <Gavel className="w-3 h-3 text-emerald-600" />
                      <span>{rec.actAndSection}</span>
                    </div>

                    <div className="mt-2.5 text-xs text-slate-600 space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <strong>{isHi ? "गैर-सायल" : "Respondent"}:</strong>{" "}
                        <span className="font-semibold text-slate-800">{rec.respondentName}</span>
                        {rec.respondentFather ? ` (${isHi ? "पिता" : "S/o"}: ${rec.respondentFather})` : ""}
                      </div>
                      <div>
                        <strong>{isHi ? "न्यायालय" : "Court"}:</strong> {rec.magistrateCourt}
                      </div>
                      <div>
                        <strong>{isHi ? "थाना" : "PS"}:</strong> {rec.policeStation}
                      </div>
                      <div>
                        <strong>{isHi ? "गवाह" : "Witnesses"}:</strong> {rec.witnesses?.length || 0} |{" "}
                        <strong>{isHi ? "संलग्नक" : "Docs"}:</strong> {rec.supportingDocuments?.filter((d) => d.isAttached).length || 0}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 gap-2">
                    <Button
                      onClick={() => handleDeleteRecord(rec.id)}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs px-2 h-7.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        onClick={() => handleEditRecord(rec)}
                        variant="outline"
                        size="sm"
                        className="h-7.5 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        <span>{isHi ? "संपादित" : "Edit"}</span>
                      </Button>
                      <Button
                        onClick={() => handleOpenPackage(rec)}
                        size="sm"
                        className="h-7.5 bg-[#0b192c] hover:bg-slate-800 text-white font-semibold text-xs gap-1 shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{isHi ? "दस्तावेज" : "View"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TEMPLATE MANAGER */}
      {activeTab === "manager" && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {isHi ? "कलंदरा प्रारूप प्रबंधक" : "Kalandra Template Manager"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isHi
                    ? "नए अधिनियमों, विशेष स्थानीय परिपत्रों या अभियानों के अनुसार नए कलंदरा प्रारूप जोड़ें या संपादित करें।"
                    : "Configure and customize Kalandra templates for local administrative rules and new enactments."}
                </p>
              </div>

              <Button
                onClick={() => setCustomTemplateModal(true)}
                size="sm"
                className="h-8 bg-[#0b192c] hover:bg-slate-800 text-white font-semibold text-xs gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isHi ? "नया प्रारूप जोड़ें" : "New Template"}</span>
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 touch-pan-x scrollbar-none">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">{isHi ? "शीर्षक (Title)" : "Title"}</th>
                    <th className="p-2.5">{isHi ? "धारा व कानून" : "Act & Section"}</th>
                    <th className="p-2.5">{isHi ? "विधिक स्थिति" : "Legal Status"}</th>
                    <th className="p-2.5">{isHi ? "डिफ़ॉल्ट न्यायालय" : "Default Court"}</th>
                    <th className="p-2.5 text-right">{isHi ? "कार्रवाई" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {templates.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-slate-700">{t.code}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{isHi ? t.titleHi : t.titleEn}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{t.proceduralContext}</div>
                      </td>
                      <td className="p-2.5 font-semibold text-emerald-700">{t.section}</td>
                      <td className="p-2.5">
                        {t.legalStatus === "NEEDS_LEGAL_MAPPING_VERIFICATION" ? (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Needs Verification
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-600">{isHi ? t.defaultCourtHi : t.defaultCourtEn}</td>
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => handlePreviewTemplate(t)}
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold cursor-pointer gap-1"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>{isHi ? "देखें" : "Preview"}</span>
                          </Button>
                          <Button
                            onClick={() => handleSelectTemplate(t)}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-slate-700 border-slate-200 hover:bg-slate-100 font-semibold cursor-pointer"
                          >
                            {isHi ? "उपयोग करें" : "Use"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DOCUMENT PACKAGE */}
      {viewingPackage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden touch-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingPackage(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[94vh] sm:h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            {/* Modal Header */}
            <div className="bg-[#0b192c] text-white p-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-xs sm:text-sm">
                    {viewingPackage.record.kalandraNumber} - {isHi ? "दस्तावेज पैकेज पूर्वावलोकन" : "Document Package Preview"}
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    {viewingPackage.record.templateTitle} ({viewingPackage.record.actAndSection})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrintDoc}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-7.5 gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3 h-3" />
                  <span>{isHi ? "A4 प्रिंट" : "Print"}</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setViewingPackage(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Complete Unified Kalandra Document Package without Separate Tabs */}
            <div
              ref={docScrollRef}
              className="flex-1 p-3 sm:p-6 overflow-y-auto overscroll-contain touch-pan-y bg-slate-100/90 [scrollbar-gutter:stable] scroll-smooth"
            >
              <div
                id="kalandra-complete-dossier-print"
                className="max-w-4xl mx-auto space-y-6"
              >
                {/* 1. Main Kalandra */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-300 p-6 sm:p-8">
                  <div dangerouslySetInnerHTML={{ __html: viewingPackage.pkg.mainKalandraHtml }} />
                </div>

                {/* 2. Forwarding Letter */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-300 p-6 sm:p-8 break-before-page">
                  <div dangerouslySetInnerHTML={{ __html: viewingPackage.pkg.forwardingLetterHtml }} />
                </div>

                {/* 3. Police Report */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-300 p-6 sm:p-8 break-before-page">
                  <div dangerouslySetInnerHTML={{ __html: viewingPackage.pkg.policeReportHtml }} />
                </div>

                {/* 4. Witness List */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-300 p-6 sm:p-8 break-before-page">
                  <div dangerouslySetInnerHTML={{ __html: viewingPackage.pkg.witnessListHtml }} />
                </div>

                {/* 5. Annexure List */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-300 p-6 sm:p-8 break-before-page">
                  <div dangerouslySetInnerHTML={{ __html: viewingPackage.pkg.annexureListHtml }} />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white p-3 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500">
                {isHi ? "न्यायालय प्रस्तुत करने हेतु A4 प्रिंट निकालें या पीडीएफ सेव करें।" : "Ready for print or submission before the Court."}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrintDoc}
                  size="sm"
                  className="bg-[#0b192c] hover:bg-slate-800 text-white font-semibold text-xs h-8 gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isHi ? "प्रिंट करें" : "Print"}</span>
                </Button>
                <Button
                  onClick={() => setViewingPackage(null)}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold border-slate-200 cursor-pointer"
                >
                  {isHi ? "बंद करें" : "Close"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CUSTOM TEMPLATE IN MANAGER */}
      {customTemplateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden touch-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCustomTemplateModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {isHi ? "नया कलंदरा प्रारूप जोड़ें" : "Create Custom Kalandra Template"}
              </h3>
              <button
                type="button"
                onClick={() => setCustomTemplateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-5 space-y-3.5 [scrollbar-gutter:stable]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "शीर्षक (हिंदी)" : "Title (Hindi)"} *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.titleHi || ""}
                    onChange={(e) => setNewTemplate({ ...newTemplate, titleHi: e.target.value })}
                    placeholder="e.g. कलंदरा विशेष अभियान..."
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "शीर्षक (English)" : "Title (English)"} *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.titleEn || ""}
                    onChange={(e) => setNewTemplate({ ...newTemplate, titleEn: e.target.value })}
                    placeholder="e.g. Special Kalandra..."
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "अधिनियम व धारा (Section)" : "Act & Section"} *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.section || ""}
                    onChange={(e) => setNewTemplate({ ...newTemplate, section: e.target.value })}
                    placeholder="e.g. Sec 107/151 CrPC / Local Act"
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "विधिक सत्यापन स्थिति" : "Legal Status"}
                  </label>
                  <select
                    value={newTemplate.legalStatus || "VERIFIED_STATUTORY"}
                    onChange={(e) =>
                      setNewTemplate({
                        ...newTemplate,
                        legalStatus: e.target.value as KalandraLegalStatus
                      })
                    }
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer"
                  >
                    <option value="VERIFIED_STATUTORY">Verified Statutory (वैधानिक सत्यापित)</option>
                    <option value="NEEDS_LEGAL_MAPPING_VERIFICATION">
                      Needs Legal Mapping Verification (विधि सत्यापन प्रतीक्षित)
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "डिफ़ॉल्ट न्यायालय (Court)" : "Default Court"}
                  </label>
                  <input
                    type="text"
                    value={newTemplate.defaultCourtHi || ""}
                    onChange={(e) => setNewTemplate({ ...newTemplate, defaultCourtHi: e.target.value })}
                    placeholder="न्यायालय उप-मंडल मजिस्ट्रेट / कार्यपालक दंडाधिकारी"
                    className="w-full h-8.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {isHi ? "डिफ़ॉल्ट कलंदरा आख्या प्रारूप (Hindi Narrative Template)" : "Narrative Template"}
                  </label>
                  <textarea
                    rows={3}
                    value={newTemplate.defaultNarrativeTemplateHi || ""}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, defaultNarrativeTemplateHi: e.target.value })
                    }
                    placeholder="सेवा में श्रीमान दंडाधिकारी... {{respondentName}}, {{incidentPlace}}..."
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-sans text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex justify-end gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomTemplateModal(false)}
                className="h-8 text-xs font-semibold border-slate-200 cursor-pointer"
              >
                {isHi ? "रद्द करें" : "Cancel"}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!newTemplate.titleHi || !newTemplate.section) {
                    alert(isHi ? "कृपया शीर्षक एवं धारा दर्ज करें।" : "Please enter title and section.");
                    return;
                  }
                  const toSave: KalandraTemplate = {
                    id: "tmpl-" + Date.now(),
                    code: newTemplate.code || "CUSTOM",
                    titleHi: newTemplate.titleHi || "",
                    titleEn: newTemplate.titleEn || newTemplate.titleHi || "",
                    actHi: newTemplate.actHi || "",
                    actEn: newTemplate.actEn || "",
                    section: newTemplate.section || "",
                    legalStatus: newTemplate.legalStatus || "VERIFIED_STATUTORY",
                    proceduralContext: newTemplate.proceduralContext || "Custom Kalandra template",
                    defaultCourtHi: newTemplate.defaultCourtHi || "न्यायालय कार्यपालक दंडाधिकारी",
                    defaultCourtEn: newTemplate.defaultCourtEn || "Court of Executive Magistrate",
                    defaultNarrativeTemplateHi: newTemplate.defaultNarrativeTemplateHi || "निवेदन है कि...",
                    defaultNarrativeTemplateEn: newTemplate.defaultNarrativeTemplateEn || "It is submitted that...",
                    supportingDocumentsList: ["GD Extract", "Spot Memo", "Witness Statements"],
                    fields: [],
                    version: "1.0",
                    isApproved: true,
                    isCustom: true
                  };
                  kalandraService.saveTemplate(toSave);
                  refreshData();
                  setCustomTemplateModal(false);
                  alert(isHi ? "नया प्रारूप सफलतापूर्वक सहेज लिया गया!" : "Template saved successfully!");
                }}
                className="h-8 bg-[#0b192c] hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer shadow-2xs"
              >
                {isHi ? "प्रारूप सहेजें" : "Save Template"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KalandraWorkspacePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-500 font-sans">Loading Kalandra Workspace...</div>}>
      <KalandraWorkspaceContent />
    </React.Suspense>
  );
}

