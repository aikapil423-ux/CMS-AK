"use client";

import React, { useState, useEffect } from "react";
import {
  ScrutinyPerformaRecord,
  ScrutinyChecklist,
} from "@/types/prosecution";
import { ProsecutionService } from "@/services/prosecutionService";
import {
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Trash2,
  FileCheck2,
  Building,
  User,
  Scale,
  X,
  FileText,
} from "lucide-react";
import { printA4Element } from "@/utils/printElement";

const INITIAL_CHECKLIST: ScrutinyChecklist = {
  firAndGdCopies: true,
  statements180Bnss: true,
  sitePlanNaksha: true,
  arrestMemoNotice35: true,
  mlcPostMortemReport: true,
  fslForensicReport: true,
  section105AudioVideo: true,
  seizureMalkhanaEntry: true,
  antecedentRecord: true,
  seniorOfficerSupervision: true,
};

export function ScrutinyPerformView() {
  const [records, setRecords] = useState<ScrutinyPerformaRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PASSED" | "OBJECTION_RETURNED" | "PENDING_FSL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<ScrutinyPerformaRecord | null>(null);

  // Form state
  const availableFirs = ProsecutionService.getAvailableFirs();
  const [selectedFirNumber, setSelectedFirNumber] = useState(availableFirs[0]?.firNumber || "");
  const [courtName, setCourtName] = useState("Court of Ld. Chief Judicial Magistrate, Panipat");
  const [challanType, setChallanType] = useState<ScrutinyPerformaRecord["challanType"]>("FINAL_CHARGESHEET");
  const [scrutinyOfficer, setScrutinyOfficer] = useState("Sh. D.S. Yadav, Ld. Deputy ADA");
  const [decision, setDecision] = useState<ScrutinyPerformaRecord["decision"]>("PASSED");
  const [objectionsNote, setObjectionsNote] = useState("");
  const [checklist, setChecklist] = useState<ScrutinyChecklist>(INITIAL_CHECKLIST);

  const loadData = async () => {
    const list = await ProsecutionService.getScrutinyRecords();
    setRecords(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFirSelect = (firNo: string) => {
    setSelectedFirNumber(firNo);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const firMeta = availableFirs.find((f) => f.firNumber === selectedFirNumber) || availableFirs[0];

    const newRecord: ScrutinyPerformaRecord = {
      id: `SCR-${Date.now()}`,
      scrutinyNumber: `SCR/${new Date().getFullYear()}/${String(records.length + 1).padStart(4, "0")}`,
      firNumber: selectedFirNumber || firMeta?.firNumber || "FIR/0284/2026",
      policeStation: firMeta?.policeStation || "PS City Panipat",
      district: "Panipat",
      actsAndSections: firMeta?.actsAndSections || "Sec 304, 3(5) BNS",
      complainantName: firMeta?.complainantName || "State",
      accusedNames: firMeta?.accusedNames || "Accused",
      investigationOfficer: firMeta?.ioName || "SI Sandeep Singh",
      ioRankAndBelt: firMeta?.ioRank || "Sub-Inspector",
      submissionDate: new Date().toLocaleDateString("en-IN"),
      scrutinyDate: new Date().toLocaleDateString("en-IN"),
      scrutinyOfficer,
      decision,
      checklist,
      objectionsNote: decision === "OBJECTION_RETURNED" ? objectionsNote : undefined,
      courtName,
      challanType,
    };

    await ProsecutionService.saveScrutinyRecord(newRecord);
    await loadData();
    setIsModalOpen(false);
    // Reset form
    setDecision("PASSED");
    setObjectionsNote("");
    setChecklist(INITIAL_CHECKLIST);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this scrutiny record?")) {
      await ProsecutionService.deleteScrutinyRecord(id);
      await loadData();
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchSearch =
      r.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.policeStation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.scrutinyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.investigationOfficer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "ALL" || r.decision === statusFilter;
    return matchSearch && matchStatus;
  });

  const passedCount = records.filter((r) => r.decision === "PASSED").length;
  const objectionCount = records.filter((r) => r.decision === "OBJECTION_RETURNED").length;
  const pendingCount = records.filter((r) => r.decision === "PENDING_FSL").length;

  return (
    <div className="space-y-4">
      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Passed For Court</span>
            <span className="text-xl font-black text-emerald-700">{passedCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Returned with Objections</span>
            <span className="text-xl font-black text-rose-700">{objectionCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Pending FSL / Sanction</span>
            <span className="text-xl font-black text-blue-700">{pendingCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Control Action Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Scrutiny No, FIR, Police Station, IO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-900"}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("PASSED")}
              className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === "PASSED" ? "bg-white text-emerald-800 shadow-2xs" : "hover:text-slate-900"}`}
            >
              Passed
            </button>
            <button
              onClick={() => setStatusFilter("OBJECTION_RETURNED")}
              className={`px-2.5 py-1 rounded-md transition-colors ${statusFilter === "OBJECTION_RETURNED" ? "bg-white text-rose-800 shadow-2xs" : "hover:text-slate-900"}`}
            >
              Objections
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0b192c] hover:bg-[#081225] rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Scrutiny Performa</span>
          </button>
        </div>
      </div>

      {/* Scrutiny Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Scrutiny Ref</th>
                <th className="py-2.5 px-3">FIR & Station</th>
                <th className="py-2.5 px-3">Sections of Law</th>
                <th className="py-2.5 px-3">Accused / Complainant</th>
                <th className="py-2.5 px-3">IO Details</th>
                <th className="py-2.5 px-3">Target Court</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    No challan scrutiny records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {r.scrutinyNumber}
                      <span className="block text-[10px] font-normal text-slate-400">{r.scrutinyDate}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900">{r.firNumber}</span>
                      <span className="block text-[11px] text-slate-500">{r.policeStation}</span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700 max-w-xs truncate" title={r.actsAndSections}>
                      {r.actsAndSections}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800">{r.accusedNames}</span>
                      <span className="block text-[10px] text-slate-400">Comp: {r.complainantName}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-600">
                      <span className="font-medium text-slate-900">{r.investigationOfficer}</span>
                      <span className="block text-slate-400">{r.ioRankAndBelt}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-600 truncate max-w-[140px]" title={r.courtName}>
                      {r.courtName}
                    </td>
                    <td className="py-2.5 px-3">
                      {r.decision === "PASSED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Passed
                        </span>
                      ) : r.decision === "OBJECTION_RETURNED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          Objections
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3" />
                          Pending FSL
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      <button
                        onClick={() => setViewingRecord(r)}
                        className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        title="View Performa & Print"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Scrutiny Performa Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">New Challan Scrutiny Performa</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Case FIR</label>
                  <select
                    value={selectedFirNumber}
                    onChange={(e) => handleFirSelect(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    {availableFirs.map((f) => (
                      <option key={f.firNumber} value={f.firNumber}>
                        {f.firNumber} - {f.policeStation} ({f.actsAndSections})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Challan Report Type</label>
                  <select
                    value={challanType}
                    onChange={(e) => setChallanType(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="FINAL_CHARGESHEET">Final Form / Chargesheet (193 BNSS)</option>
                    <option value="SUPPLEMENTARY">Supplementary Challan</option>
                    <option value="CANCELLATION">Cancellation Report</option>
                    <option value="UNTRACED">Untraced Report</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Court</label>
                  <input
                    type="text"
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Scrutiny Officer / ADA</label>
                  <input
                    type="text"
                    value={scrutinyOfficer}
                    onChange={(e) => setScrutinyOfficer(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* 10-Point Checklist */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block border-b border-slate-200 pb-1">
                  Statutory Verification Checklist (10 Points)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.firAndGdCopies}
                      onChange={(e) => setChecklist({ ...checklist, firAndGdCopies: e.target.checked })}
                      className="rounded"
                    />
                    <span>1. FIR & First GD Copy Annexed</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.statements180Bnss}
                      onChange={(e) => setChecklist({ ...checklist, statements180Bnss: e.target.checked })}
                      className="rounded"
                    />
                    <span>2. Witness Statements u/s 180 BNSS</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.sitePlanNaksha}
                      onChange={(e) => setChecklist({ ...checklist, sitePlanNaksha: e.target.checked })}
                      className="rounded"
                    />
                    <span>3. Scaled Site Plan / Naksha Moka</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.arrestMemoNotice35}
                      onChange={(e) => setChecklist({ ...checklist, arrestMemoNotice35: e.target.checked })}
                      className="rounded"
                    />
                    <span>4. Arrest Memo / 35(3) BNSS Notice</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.mlcPostMortemReport}
                      onChange={(e) => setChecklist({ ...checklist, mlcPostMortemReport: e.target.checked })}
                      className="rounded"
                    />
                    <span>5. MLC / Post-Mortem Report</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.fslForensicReport}
                      onChange={(e) => setChecklist({ ...checklist, fslForensicReport: e.target.checked })}
                      className="rounded"
                    />
                    <span>6. FSL / Ballistic / Chemical Report</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.section105AudioVideo}
                      onChange={(e) => setChecklist({ ...checklist, section105AudioVideo: e.target.checked })}
                      className="rounded"
                    />
                    <span>7. Sec 105 Audio-Video Recording</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.seizureMalkhanaEntry}
                      onChange={(e) => setChecklist({ ...checklist, seizureMalkhanaEntry: e.target.checked })}
                      className="rounded"
                    />
                    <span>8. Seizure Memo & Malkhana Reg. 19</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.antecedentRecord}
                      onChange={(e) => setChecklist({ ...checklist, antecedentRecord: e.target.checked })}
                      className="rounded"
                    />
                    <span>9. Accused Criminal Antecedent List</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.seniorOfficerSupervision}
                      onChange={(e) => setChecklist({ ...checklist, seniorOfficerSupervision: e.target.checked })}
                      className="rounded"
                    />
                    <span>10. SHO / DSP Supervision Note</span>
                  </label>
                </div>
              </div>

              {/* Scrutiny Decision */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Scrutiny Decision</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision("PASSED")}
                    className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold transition-colors ${
                      decision === "PASSED"
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Passed for Court
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("OBJECTION_RETURNED")}
                    className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold transition-colors ${
                      decision === "OBJECTION_RETURNED"
                        ? "bg-rose-700 text-white border-rose-700"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Return with Objections
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("PENDING_FSL")}
                    className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold transition-colors ${
                      decision === "PENDING_FSL"
                        ? "bg-blue-700 text-white border-blue-700"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Pending FSL
                  </button>
                </div>
              </div>

              {decision === "OBJECTION_RETURNED" && (
                <div>
                  <label className="text-[11px] font-bold text-rose-700 block mb-1">
                    Deficiency & Objections to be Rectified by IO
                  </label>
                  <textarea
                    rows={3}
                    placeholder="List specific missing documents, unsigned memos, or discrepancies..."
                    value={objectionsNote}
                    onChange={(e) => setObjectionsNote(e.target.value)}
                    className="w-full p-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-600 bg-rose-50/20"
                    required
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0b192c] hover:bg-[#081225] text-white font-bold"
                >
                  Save Scrutiny Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Performa / Print Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-xs text-slate-900">Challan Scrutiny Performa Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printA4Element("printable-scrutiny-dossier", viewingRecord.scrutinyNumber)}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold"
                >
                  <Printer className="w-3 h-3" />
                  Print Performa
                </button>
                <button onClick={() => setViewingRecord(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div id="printable-scrutiny-dossier" className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-slate-900 bg-white">
              <div className="text-center border-b pb-3">
                <h2 className="text-base font-black uppercase">DIRECTORATE OF PROSECUTION, HARYANA</h2>
                <h3 className="text-xs font-bold text-slate-700 uppercase">CHALLAN SCRUTINY CERTIFICATE & PERFORMA</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Ref No: {viewingRecord.scrutinyNumber} &bull; Date: {viewingRecord.scrutinyDate}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 border p-3 rounded-lg bg-slate-50/50">
                <div><span className="font-bold text-slate-600">Police Station:</span> {viewingRecord.policeStation}</div>
                <div><span className="font-bold text-slate-600">District:</span> {viewingRecord.district}</div>
                <div><span className="font-bold text-slate-600">Case FIR:</span> {viewingRecord.firNumber}</div>
                <div><span className="font-bold text-slate-600">Sections:</span> {viewingRecord.actsAndSections}</div>
                <div><span className="font-bold text-slate-600">Investigating Officer:</span> {viewingRecord.investigationOfficer} ({viewingRecord.ioRankAndBelt})</div>
                <div><span className="font-bold text-slate-600">Target Court:</span> {viewingRecord.courtName}</div>
                <div className="col-span-2"><span className="font-bold text-slate-600">Accused Persons:</span> {viewingRecord.accusedNames}</div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1 border-b pb-1 text-[11px]">CHECKLIST VERIFICATION</h4>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {Object.entries(viewingRecord.checklist).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className={val ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                        {val ? "✓" : "✗"}
                      </span>
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold">SCRUTINY DECISION:</span>
                  <span className="font-black uppercase tracking-wider text-sm px-2.5 py-0.5 rounded bg-slate-100">
                    {viewingRecord.decision.replace("_", " ")}
                  </span>
                </div>
                {viewingRecord.objectionsNote && (
                  <div className="mt-2 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[11px]">
                    <span className="font-bold block">Objection Remarks to IO:</span>
                    {viewingRecord.objectionsNote}
                  </div>
                )}
              </div>

              <div className="pt-8 flex justify-between text-center text-[11px]">
                <div>
                  <div className="border-t border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-semibold">Investigating Officer (IO)</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-44 mx-auto mb-1"></div>
                  <span className="font-bold">{viewingRecord.scrutinyOfficer}</span>
                  <p className="text-[10px] text-slate-500">Public Prosecutor / Scrutiny ADA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
