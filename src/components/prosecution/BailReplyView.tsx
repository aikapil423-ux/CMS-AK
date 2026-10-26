"use client";

import React, { useState, useEffect } from "react";
import { BailReplyRecord } from "@/types/prosecution";
import { ProsecutionService } from "@/services/prosecutionService";
import {
  Search,
  Plus,
  Scale,
  Printer,
  Trash2,
  Calendar,
  X,
  FileText,
  AlertCircle,
  Building,
} from "lucide-react";
import { printA4Element } from "@/utils/printElement";

const STANDARD_GROUNDS = [
  "Grave and heinous nature of offence carrying severe statutory punishment",
  "Weapon / Case property recovery is still pending from accused",
  "Apprehension of threat or intimidation to material prosecution witnesses",
  "High risk of accused absconding or fleeing the course of justice",
  "Investigation is at crucial stage; chemical/FSL reports awaited",
  "Accused is habitual offender with previous criminal record",
  "Custodial interrogation is indispensable to unearth full conspiracy",
];

export function BailReplyView() {
  const [replies, setReplies] = useState<BailReplyRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingReply, setViewingReply] = useState<BailReplyRecord | null>(null);

  // Form state
  const availableFirs = ProsecutionService.getAvailableFirs();
  const [selectedFir, setSelectedFir] = useState(availableFirs[0]?.firNumber || "");
  const [courtName, setCourtName] = useState("Court of Ld. Sessions Judge, Panipat");
  const [applicantName, setApplicantName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [bailType, setBailType] = useState<BailReplyRecord["bailType"]>("REGULAR");
  const [hearingDate, setHearingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString("en-IN");
  });
  const [selectedGrounds, setSelectedGrounds] = useState<string[]>([STANDARD_GROUNDS[0], STANDARD_GROUNDS[2]]);
  const [ioCaseSummary, setIoCaseSummary] = useState("");
  const [antecedents, setAntecedents] = useState("No previous involvement verified.");

  const loadData = async () => {
    const data = await ProsecutionService.getBailReplies();
    setReplies(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFirChange = (firNo: string) => {
    setSelectedFir(firNo);
    const meta = availableFirs.find((f) => f.firNumber === firNo);
    if (meta) {
      setApplicantName(meta.accusedNames.split(",")[0] || "");
    }
  };

  const toggleGround = (ground: string) => {
    setSelectedGrounds((prev) =>
      prev.includes(ground) ? prev.filter((g) => g !== ground) : [...prev, ground]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const firMeta = availableFirs.find((f) => f.firNumber === selectedFir) || availableFirs[0];

    const newRecord: BailReplyRecord = {
      id: `BAIL-${Date.now()}`,
      applicationNo: `BA/${Math.floor(100 + Math.random() * 900)}/${new Date().getFullYear()}`,
      firNumber: selectedFir || firMeta?.firNumber || "FIR/0004/2026",
      policeStation: firMeta?.policeStation || "PS City Panipat",
      courtName,
      applicantAccusedName: applicantName || firMeta?.accusedNames || "Accused",
      fatherName,
      bailType,
      ipcOrBnsSections: firMeta?.actsAndSections || "Sec 304 BNS",
      hearingDate,
      status: "SUBMITTED",
      groundsOfOpposition: selectedGrounds,
      ioCaseSummary: ioCaseSummary || "Prima facie case established against accused during investigation.",
      antecedentsDetails: antecedents,
      submittedByOfficer: `${firMeta?.ioName || "SI IO"}, ${firMeta?.ioRank || "Sub-Inspector"}`,
      submissionDate: new Date().toLocaleDateString("en-IN"),
    };

    await ProsecutionService.saveBailReply(newRecord);
    await loadData();
    setIsModalOpen(false);
    // Reset form
    setApplicantName("");
    setFatherName("");
    setIoCaseSummary("");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this bail reply record?")) {
      await ProsecutionService.deleteBailReply(id);
      await loadData();
    }
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
                      {r.bailType} BAIL
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
                    <span>View & Print</span>
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

      {/* New Bail Reply Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">Draft Police Reply to Bail Application</h3>
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
                    value={selectedFir}
                    onChange={(e) => handleFirChange(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {availableFirs.map((f) => (
                      <option key={f.firNumber} value={f.firNumber}>
                        {f.firNumber} - {f.policeStation} ({f.actsAndSections})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Bail Category</label>
                  <select
                    value={bailType}
                    onChange={(e) => setBailType(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    <option value="REGULAR">Regular Bail (Sec 483 BNSS / 437/439 CrPC)</option>
                    <option value="ANTICIPATORY">Anticipatory Bail (Sec 482 BNSS / 438 CrPC)</option>
                    <option value="INTERIM">Interim Bail</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Hon'ble Court</label>
                  <input
                    type="text"
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Hearing Date</label>
                  <input
                    type="text"
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Applicant / Accused Name</label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Rohit @ Kalu"
                    className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Father's / Spouse Name</label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="e.g. Sh. Mahesh Kumar"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Standard Opposition Grounds */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Select Grounds of Police Opposition
                </label>
                <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-40 overflow-y-auto">
                  {STANDARD_GROUNDS.map((g, idx) => (
                    <label key={idx} className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedGrounds.includes(g)}
                        onChange={() => toggleGround(g)}
                        className="mt-0.5 rounded"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Brief Facts of Case (IO Summary)</label>
                <textarea
                  rows={2}
                  value={ioCaseSummary}
                  onChange={(e) => setIoCaseSummary(e.target.value)}
                  placeholder="Specific role of applicant in commission of crime and incriminating evidence..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Criminal Antecedents</label>
                <input
                  type="text"
                  value={antecedents}
                  onChange={(e) => setAntecedents(e.target.value)}
                  placeholder="Details of previous FIRs or NIL..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

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
                  Save & File Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View & Print Document Modal */}
      {viewingReply && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-xs text-slate-900">Police Bail Reply Document Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printA4Element("printable-bail-reply", `Bail_Reply_${viewingReply.applicantAccusedName}`)}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold"
                >
                  <Printer className="w-3 h-3" />
                  Print Reply
                </button>
                <button onClick={() => setViewingReply(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div id="printable-bail-reply" className="p-8 overflow-y-auto space-y-4 text-xs font-sans text-slate-900 bg-white leading-relaxed">
              <div className="text-center border-b pb-4">
                <h3 className="font-bold uppercase text-xs">IN THE {viewingReply.courtName.toUpperCase()}</h3>
                <p className="text-[11px] font-mono mt-1">Application No: {viewingReply.applicationNo}</p>
                <p className="font-black mt-2 text-sm uppercase">IN THE MATTER OF:</p>
                <p className="font-bold">{viewingReply.applicantAccusedName} {viewingReply.fatherName ? `S/o ${viewingReply.fatherName}` : ""} &hellip; Applicant/Accused</p>
                <p className="font-bold my-1">VERSUS</p>
                <p className="font-bold">STATE OF HARYANA &hellip; Respondent</p>
                <p className="text-[11px] font-mono mt-2 bg-slate-50 p-1 rounded inline-block border">
                  Case FIR No: {viewingReply.firNumber} &bull; U/S: {viewingReply.ipcOrBnsSections} &bull; PS: {viewingReply.policeStation}
                </p>
              </div>

              <div>
                <h4 className="font-bold uppercase text-center text-xs mb-3 underline">
                  POLICE REPLY ON BEHALF OF STATE / RESPONDENT OPPOSING {viewingReply.bailType} BAIL
                </h4>
                <p className="mb-2"><strong>Most Respectfully Showeth:</strong></p>
                <ol className="list-decimal pl-5 space-y-2 text-[11px]">
                  <li>
                    That the present FIR was registered upon legal information of serious criminal occurrence. The applicant/accused is directly implicated with specific active role.
                  </li>
                  <li>
                    <strong>Case Brief:</strong> {viewingReply.ioCaseSummary}
                  </li>
                  <li>
                    <strong>Grounds of Opposition:</strong> The grant of bail is strongly opposed on the following statutory and factual grounds:
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {viewingReply.groundsOfOpposition.map((g, idx) => (
                        <li key={idx} className="font-medium">{g}</li>
                      ))}
                    </ul>
                  </li>
                  <li>
                    <strong>Criminal Antecedents:</strong> {viewingReply.antecedentsDetails}
                  </li>
                </ol>

                <p className="mt-4 text-[11px]">
                  <strong>PRAYER:</strong> In view of the above submissions, gravity of the crime, and threat to prosecution witnesses, it is respectfully prayed that the bail application of the accused may kindly be <strong>DISMISSED</strong> in the interest of justice.
                </p>
              </div>

              <div className="pt-8 flex justify-between text-center text-[11px]">
                <div>
                  <p>Dated: {viewingReply.submissionDate}</p>
                  <p>Place: {viewingReply.policeStation}</p>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-44 mx-auto mb-1"></div>
                  <span className="font-bold">{viewingReply.submittedByOfficer}</span>
                  <p className="text-[10px] text-slate-500">For State of Haryana (Respondent)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
