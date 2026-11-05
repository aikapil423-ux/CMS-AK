"use client";

import React, { useState, useEffect } from "react";
import {
  ScrutinyPerformaRecord,
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
  X,
  FileText,
} from "lucide-react";
import { printA4Element } from "@/utils/printElement";
import { ScrutinyPdfForm } from './ScrutinyPdfForm';
import type { PdfScrutinyRecord } from '@/services/scrutinyRepository';

export function ScrutinyPerformView() {
  const [records, setRecords] = useState<ScrutinyPerformaRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PASSED" | "OBJECTION_RETURNED" | "PENDING_FSL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<ScrutinyPerformaRecord | null>(null);

  // Form state
  const availableFirs = ProsecutionService.getAvailableFirs();
  const [loadError,setLoadError]=useState("");
  const caseConflict=(record:ScrutinyPerformaRecord)=>{
    const current=availableFirs.find(f=>f.firNumber===record.firNumber&&f.policeStation===record.policeStation);
    if(!current)return 'Linked FIR is unavailable. Verify this saved snapshot before use.';
    return current.accusedNames!==record.accusedNames||current.ioName!==record.investigationOfficer||current.actsAndSections!==record.actsAndSections
      ?`Saved snapshot differs from current FIR. Current accused: ${current.accusedNames}; IO: ${current.ioName}; sections: ${current.actsAndSections}. Review before using this record.`:'';
  };
  const loadData = async () => {
    try { setRecords(await ProsecutionService.getScrutinyRecords()); setLoadError(''); }
    catch (error) { setLoadError(error instanceof Error ? error.message : 'Records could not be loaded.'); }
  };
  useEffect(() => {
    let active=true;
    ProsecutionService.getScrutinyRecords().then(list=>{if(active){setRecords(list);setLoadError('');}})
      .catch(error=>{if(active)setLoadError(error instanceof Error?error.message:'Records could not be loaded.');});
    return()=>{active=false;};
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this scrutiny record?")) {
      try { await ProsecutionService.deleteScrutinyRecord(id); await loadData(); }
      catch (error) { setLoadError(error instanceof Error ? error.message : 'Delete failed.'); }
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


  return (
    <div className="space-y-4">
      {loadError && <p role="alert" className="text-red-700 text-xs">{loadError}</p>}
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
                      {caseConflict(r) && <p className="mt-1 text-xs text-amber-800" role="status">{caseConflict(r)}</p>}
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
                          {r.decision === 'DRAFT' ? 'Draft' : 'Pending FSL'}
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

      {/* The New button always opens the current 12-page editable packet. */}
      {isModalOpen && <ScrutinyPdfForm onClose={() => setIsModalOpen(false)} onSaved={() => void loadData()} />}

      {/* View Performa / Print Modal */}
      {viewingRecord && 'fields' in viewingRecord && <ScrutinyPdfForm initial={viewingRecord as PdfScrutinyRecord} onClose={()=>setViewingRecord(null)} onSaved={()=>void loadData()} />}
      {viewingRecord && !('fields' in viewingRecord) && (
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
