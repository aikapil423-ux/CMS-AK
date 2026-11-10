"use client";

import React, { useState, useEffect } from "react";
import { BailReplyRecord } from "@/types/prosecution";
import { bailReplyTypes } from "@/lib/courtAffidavit";
import { ProsecutionService } from "@/services/prosecutionService";
import {
  Search,
  Plus,
  Scale,
  Trash2,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";
import { CourtAffidavitEditor, listCourtAffidavits, removeCourtAffidavit } from "./CourtAffidavitEditor";

export function BailReplyView() {
  const [replies, setReplies] = useState<BailReplyRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingReply, setViewingReply] = useState<BailReplyRecord | null>(null);

  const [loadError, setLoadError] = useState("");

  const loadData = async () => {
    const legacy = await ProsecutionService.getBailReplies();
    try {
      setReplies(await listCourtAffidavits("bail", legacy));
      setLoadError("");
    } catch (error) {
      setReplies(legacy);
      setLoadError(error instanceof Error ? error.message : "Saved court documents could not be loaded.");
    }
  };

  useEffect(() => { void loadData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this saved document?")) return;
    try {
      if (replies.some(record => record.id === id && record.affidavit)) await removeCourtAffidavit("bail", id);
      await ProsecutionService.deleteBailReply(id);
      await loadData();
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Delete failed."); }
  };

  const filteredReplies = replies.filter((r) => {
    const matchType = typeFilter === "ALL" || r.bailType === typeFilter;
    const matchSearch =
      r.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.applicantAccusedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.courtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.applicationNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-4">
      {loadError && <p role="alert" className="text-sm text-red-700">{loadError}</p>}
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Bail Replies</span>
            <span className="text-xl font-black text-slate-900">{replies.length}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Scale className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Regular Bail Replies</span>
            <span className="text-xl font-black text-blue-700">
              {replies.filter((r) => r.bailType === "REGULAR").length}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Anticipatory Bail (ABA)</span>
            <span className="text-xl font-black text-purple-700">
              {replies.filter((r) => r.bailType === "ANTICIPATORY").length}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Accused, FIR No, Application No, Court..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Bail Types</option>
            <option value="REGULAR">Regular Bail</option>
            <option value="ANTICIPATORY">Anticipatory Bail</option>
            <option value="INTERIM">Interim Bail</option>
            <option value="OTHER">Other Bail Reply</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0b192c] hover:bg-[#081225] rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Draft Police Bail Reply</span>
          </button>
        </div>
      </div>

      {/* Bail Replies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredReplies.length === 0 ? (
          <div className="col-span-2 p-10 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
            No bail replies registered. Click "Draft Police Bail Reply" to create one.
          </div>
        ) : (
          filteredReplies.map((r) => (
            <div
              key={r.id}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-300 font-mono">
                      {r.applicationNo}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {r.affidavit?.customType || bailReplyTypes[r.bailType]}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">Applicant: {r.applicantAccusedName}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">Case: {r.firNumber} &bull; {r.policeStation}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Hearing</span>
                  <span className="text-xs font-bold font-mono text-slate-800 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {r.hearingDate}
                  </span>
                </div>
              </div>

              <div className="text-[11px] space-y-1.5 text-slate-600">
                <p><strong className="text-slate-800">Court:</strong> {r.courtName}</p>
                <p><strong className="text-slate-800">Sections:</strong> {r.ipcOrBnsSections}</p>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <strong className="text-slate-800 block text-[10px] uppercase tracking-wider mb-1">
                    Opposition Grounds ({r.groundsOfOpposition.length}):
                  </strong>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-600">
                    {r.groundsOfOpposition.slice(0, 2).map((g, idx) => (
                      <li key={idx} className="truncate">{g}</li>
                    ))}
                    {r.groundsOfOpposition.length > 2 && (
                      <li className="text-slate-400 italic">+{r.groundsOfOpposition.length - 2} more grounds...</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 font-mono">By: {r.submittedByOfficer}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewingReply(r)}
                    className="flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-bold bg-[#0b192c] text-white hover:bg-[#081225]"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Edit / Preview</span>
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {(isModalOpen || viewingReply) && (
        <CourtAffidavitEditor kind="bail" record={viewingReply || undefined}
          onClose={() => { setIsModalOpen(false); setViewingReply(null); }}
          onSaved={() => { setIsModalOpen(false); setViewingReply(null); void loadData(); }} />
      )}
    </div>
  );
}
