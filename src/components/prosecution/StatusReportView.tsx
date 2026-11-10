"use client";

import React, { useState, useEffect } from "react";
import { CourtStatusReportRecord } from "@/types/prosecution";
import { ProsecutionService } from "@/services/prosecutionService";
import {
  Search,
  Plus,
  Scale,
  Trash2,
  Calendar,
  FileCheck2,
  Eye,
} from "lucide-react";
import { CourtAffidavitEditor, listCourtAffidavits, removeCourtAffidavit } from "./CourtAffidavitEditor";
import { statusReportTypes } from "@/lib/courtAffidavit";

const STAGE_LABELS: Record<NonNullable<CourtStatusReportRecord["investigationStage"]>, { label: string; color: string }> = {
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

  const [loadError, setLoadError] = useState("");

  const loadData = async () => {
    const legacy = await ProsecutionService.getStatusReports();
    try {
      setReports(await listCourtAffidavits("status", legacy));
      setLoadError("");
    } catch (error) {
      setReports(legacy);
      setLoadError(error instanceof Error ? error.message : "Saved court documents could not be loaded.");
    }
  };

  useEffect(() => { void loadData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this saved document?")) return;
    try {
      if (reports.some(record => record.id === id && record.affidavit)) await removeCourtAffidavit("status", id);
      await ProsecutionService.deleteStatusReport(id);
      await loadData();
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Delete failed."); }
  };

  const filteredReports = reports.filter((r) => {
    const matchSearch =
      r.reportRefNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.affidavit?.fields.complaint || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.courtName.toLowerCase().includes(searchTerm.toLowerCase());
    const selectedStage = STAGE_LABELS[stageFilter as keyof typeof STAGE_LABELS]?.label;
    const matchStage = stageFilter === "ALL" || (!r.affidavit && r.investigationStage === stageFilter) ||
      (!!selectedStage && r.affidavit?.fields.stage?.trim().toLowerCase() === selectedStage.toLowerCase());
    return matchSearch && matchStage;
  });

  return (
    <div className="space-y-6">
      {loadError && <p role="alert" className="text-sm text-red-700">{loadError}</p>}
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            Court Status Reports (अदालती स्थिति रिपोर्ट)
          </h2>

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
                  const stageMeta = r.investigationStage ? STAGE_LABELS[r.investigationStage] : undefined;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{r.reportRefNo}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{r.caseTitle}</div>
                        <div className="text-[11px] text-slate-500">{r.petitionNumber}</div>
                        {r.reportType && <div className="text-[11px] text-slate-600">{r.affidavit?.customType || statusReportTypes[r.reportType]}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{r.firNumber || r.affidavit?.fields.complaint}</div>
                        <div className="text-[11px] text-slate-500">{r.policeStation}</div>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate text-slate-700" title={r.courtName}>
                        {r.courtName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stageMeta?.color || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                          {r.affidavit?.fields.stage || stageMeta?.label || "—"}
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
                            title="Edit / Preview Court Dossier"
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

      {(isModalOpen || viewingReport) && (
        <CourtAffidavitEditor kind="status" record={viewingReport || undefined}
          onClose={() => { setIsModalOpen(false); setViewingReport(null); }}
          onSaved={() => { setIsModalOpen(false); setViewingReport(null); void loadData(); }} />
      )}
    </div>
  );
}
