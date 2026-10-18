"use client";

import React, { useState, useEffect } from "react";
import { CourtStatusReportRecord } from "@/types/prosecution";
import { ProsecutionService } from "@/services/prosecutionService";
import {
  Search,
  Plus,
  Scale,
  Printer,
  Trash2,
  Calendar,
  X,
  FileCheck2,
  Building2,
  Clock,
  Eye,
} from "lucide-react";
import { printA4Element } from "@/utils/printElement";

const COURT_OPTIONS = [
  "Hon'ble High Court of Punjab & Haryana at Chandigarh",
  "Court of Ld. District & Sessions Judge, Panipat",
  "Court of Ld. Additional Sessions Judge, Panipat",
  "Court of Ld. Chief Judicial Magistrate (CJM), Panipat",
];

const STAGE_LABELS: Record<CourtStatusReportRecord["investigationStage"], { label: string; color: string }> = {
  UNDER_INVESTIGATION: { label: "Under Investigation", color: "bg-amber-100 text-amber-800 border-amber-200" },
  CHALLAN_PREPARED: { label: "Final Report Ready", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PENDING_SANCTION: { label: "Sanction Pending", color: "bg-blue-100 text-blue-800 border-blue-200" },
  UNTRACED: { label: "Untraced Report", color: "bg-gray-100 text-gray-700 border-gray-300" },
};

export function StatusReportView() {
  const [reports, setReports] = useState<CourtStatusReportRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<CourtStatusReportRecord | null>(null);

  const availableFirs = ProsecutionService.getAvailableFirs();

  // Form State
  const [selectedFir, setSelectedFir] = useState(availableFirs[0]?.firNumber || "");
  const [courtName, setCourtName] = useState(COURT_OPTIONS[0]);
  const [caseTitle, setCaseTitle] = useState("");
  const [petitionNumber, setPetitionNumber] = useState("");
  const [stage, setStage] = useState<CourtStatusReportRecord["investigationStage"]>("UNDER_INVESTIGATION");
  const [keyEvidence, setKeyEvidence] = useState("");
  const [accusedStatus, setAccusedStatus] = useState("Main accused arrested and in judicial custody. Co-accused identified.");
  const [prayer, setPrayer] = useState("It is humbly prayed that the present petition may kindly be disposed of as the police is conducting fair investigation in accordance with law.");
  const [hearingDate, setHearingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString("en-IN");
  });

  const loadData = async () => {
    const data = await ProsecutionService.getStatusReports();
    setReports(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFirChange = (firNo: string) => {
    setSelectedFir(firNo);
    const meta = availableFirs.find((f) => f.firNumber === firNo);
    if (meta) {
      setCaseTitle(`CRM-M/2026: ${meta.accusedNames.split(",")[0] || "Accused"} vs State of Haryana`);
      setKeyEvidence(`Statements of material witnesses recorded under Sec 180 BNSS. Site plan prepared. CCTVs verified.`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const firMeta = availableFirs.find((f) => f.firNumber === selectedFir) || availableFirs[0];

    const newRecord: CourtStatusReportRecord = {
      id: `sr-${Date.now()}`,
      reportRefNo: `SR-${new Date().getFullYear()}/${String(reports.length + 1).padStart(3, "0")}`,
      firNumber: selectedFir,
      policeStation: firMeta?.policeStation || "PS City Panipat",
      courtName,
      caseTitle: caseTitle || `State vs ${firMeta?.accusedNames || "Accused"}`,
      petitionNumber: petitionNumber || `CRM-M-${Math.floor(10000 + Math.random() * 90000)}/2026`,
      investigationStage: stage,
      keyEvidenceCollected: keyEvidence || "Material witnesses examined; case property deposited in Malkhana.",
      accusedStatus,
      policePrayer: prayer,
      hearingDate,
      submittedBy: `${firMeta?.ioRank || "SI"} ${firMeta?.ioName || "IO"}`,
      submissionDate: new Date().toLocaleDateString("en-IN"),
    };

    await ProsecutionService.saveStatusReport(newRecord);
    setIsModalOpen(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this status report?")) {
      await ProsecutionService.deleteStatusReport(id);
      loadData();
      if (viewingReport?.id === id) setViewingReport(null);
    }
  };

  const resetForm = () => {
    setCaseTitle("");
    setPetitionNumber("");
    setKeyEvidence("");
  };

  const filteredReports = reports.filter((r) => {
    const matchSearch =
      r.reportRefNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.courtName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStage = stageFilter === "ALL" || r.investigationStage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            Court Status Reports (अदालती स्थिति रिपोर्ट)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official police progress reports submitted before Hon&apos;ble High Court, Sessions Court, and Magistrate.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Draft Status Report
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search report no, FIR, title, court..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Stage:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Stages</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="CHALLAN_PREPARED">Final Report Prepared</option>
            <option value="PENDING_SANCTION">Pending Sanction</option>
            <option value="UNTRACED">Untraced Report</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ref No.</th>
                <th className="py-3 px-4">Case Title & Petition</th>
                <th className="py-3 px-4">FIR & Station</th>
                <th className="py-3 px-4">Court</th>
                <th className="py-3 px-4">Investigation Stage</th>
                <th className="py-3 px-4">Next Hearing</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No status reports found.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const stageMeta = STAGE_LABELS[r.investigationStage];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{r.reportRefNo}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{r.caseTitle}</div>
                        <div className="text-[11px] text-slate-500">{r.petitionNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{r.firNumber}</div>
                        <div className="text-[11px] text-slate-500">{r.policeStation}</div>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate text-slate-700" title={r.courtName}>
                        {r.courtName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stageMeta.color}`}>
                          {stageMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {r.hearingDate}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setViewingReport(r)}
                            title="View / Print Court Dossier"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            title="Delete Record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">Draft Court Status Report</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* FIR & Court */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target FIR No.</label>
                  <select
                    value={selectedFir}
                    onChange={(e) => handleFirChange(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                  >
                    {availableFirs.map((f) => (
                      <option key={f.firNumber} value={f.firNumber}>
                        {f.firNumber} ({f.policeStation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Hon&apos;ble Court</label>
                  <select
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                  >
                    {COURT_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Case Title & Petition Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Petition / Case No.</label>
                  <input
                    type="text"
                    placeholder="e.g. CRM-M-14022/2026 or CRR-442/2026"
                    value={petitionNumber}
                    onChange={(e) => setPetitionNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Case Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar vs State of Haryana"
                    value={caseTitle}
                    onChange={(e) => setCaseTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Stage & Hearing Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Present Investigation Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as CourtStatusReportRecord["investigationStage"])}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="UNDER_INVESTIGATION">Under Investigation</option>
                    <option value="CHALLAN_PREPARED">Challan / Final Report Prepared</option>
                    <option value="PENDING_SANCTION">Awaiting Statutory Sanction</option>
                    <option value="UNTRACED">Untraced / Cancellation Report</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hearing Date</label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Accused Status */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Accused Custody / Arrest Status</label>
                <input
                  type="text"
                  value={accusedStatus}
                  onChange={(e) => setAccusedStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Key Evidence Collected */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Investigation Findings & Material Evidence</label>
                <textarea
                  rows={3}
                  value={keyEvidence}
                  onChange={(e) => setKeyEvidence(e.target.value)}
                  placeholder="Detail witness statements, recovery memos, CCTV verification, digital hash data, or expert opinions gathered so far..."
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Prayer */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Police Prayer before Court</label>
                <textarea
                  rows={2}
                  value={prayer}
                  onChange={(e) => setPrayer(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition"
                >
                  Save Status Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW / PRINT MODAL */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full my-6 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-800 text-sm">Status Report Preview: {viewingReport.reportRefNo}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printA4Element("status-report-dossier")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print A4
                </button>
                <button onClick={() => setViewingReport(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Container */}
            <div className="p-6 overflow-y-auto max-h-[80vh] bg-slate-100 flex justify-center">
              <div
                id="status-report-dossier"
                className="bg-white p-8 rounded-lg shadow-sm border border-slate-300 w-full max-w-[210mm] text-slate-900 font-serif leading-relaxed text-xs"
              >
                {/* Court Header */}
                <div className="text-center border-b-2 border-black pb-4 mb-4">
                  <p className="font-bold text-sm tracking-wide uppercase">
                    IN THE {viewingReport.courtName.toUpperCase()}
                  </p>
                  <p className="text-[11px] font-sans text-slate-600 mt-1">
                    Petition / Case No: <span className="font-bold text-black">{viewingReport.petitionNumber}</span>
                  </p>
                  <p className="text-xs font-semibold mt-1">
                    IN THE MATTER OF: <span className="underline">{viewingReport.caseTitle}</span>
                  </p>
                </div>

                <div className="text-center font-bold text-xs uppercase underline tracking-wider mb-5">
                  STATUS REPORT ON BEHALF OF STATE OF HARYANA / POLICE STATION {viewingReport.policeStation.toUpperCase()}
                </div>

                {/* Body Paragraphs */}
                <div className="space-y-3 font-sans text-xs">
                  <p>
                    <span className="font-bold font-serif">MOST RESPECTFULLY SHOWETH:</span>
                  </p>

                  <p>
                    1. That the present status report is being submitted in compliance with the directions of this Hon&apos;ble Court in respect of{" "}
                    <strong>{viewingReport.firNumber}</strong> registered at Police Station{" "}
                    <strong>{viewingReport.policeStation}</strong>.
                  </p>

                  <p>
                    2. <strong>Present Investigation Stage:</strong>{" "}
                    <span className="font-semibold underline">
                      {STAGE_LABELS[viewingReport.investigationStage]?.label || viewingReport.investigationStage}
                    </span>
                    .
                  </p>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <p className="font-semibold text-slate-800 mb-1">3. Status of Accused Person(s):</p>
                    <p className="text-slate-700">{viewingReport.accusedStatus}</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <p className="font-semibold text-slate-800 mb-1">4. Evidence and Material Collected During Investigation:</p>
                    <p className="text-slate-700 whitespace-pre-line">{viewingReport.keyEvidenceCollected}</p>
                  </div>

                  <p>
                    5. <strong>Prayer before Hon&apos;ble Court:</strong>
                  </p>
                  <p className="italic pl-4 border-l-2 border-indigo-500 text-slate-800">
                    &ldquo;{viewingReport.policePrayer}&rdquo;
                  </p>
                </div>

                {/* Verification */}
                <div className="mt-6 pt-4 border-t border-slate-300 font-sans text-[11px]">
                  <p className="font-bold uppercase mb-1">Verification:</p>
                  <p className="text-slate-600">
                    Verified at Panipat on this {viewingReport.submissionDate} that the contents of the above status report are true and correct to the best of police records and investigation conducted so far.
                  </p>
                </div>

                {/* Signatures */}
                <div className="mt-8 flex justify-between items-end font-sans text-xs pt-4">
                  <div className="text-center">
                    <div className="w-32 border-b border-black mb-1 mx-auto"></div>
                    <p className="font-semibold">Station House Officer</p>
                    <p className="text-[10px] text-slate-500">{viewingReport.policeStation}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-b border-black mb-1 mx-auto"></div>
                    <p className="font-semibold">{viewingReport.submittedBy}</p>
                    <p className="text-[10px] text-slate-500">Investigating Officer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
