"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { affidavitLabels, bailReplyTypes, statusReportTypes, type AffidavitBlock, type AffidavitField, type AffidavitFields, type CourtAffidavit, type CourtAnnexure } from "@/lib/courtAffidavit";
import type { BailReplyRecord, CourtStatusReportRecord } from "@/types/prosecution";
import { printA4Element } from "@/utils/printElement";

type RecordItem = BailReplyRecord | CourtStatusReportRecord;
type FirOption = { id: string; firNumber: string; policeStation: string };
type Source = { id: string; name: string };
type Kind = "bail" | "status";
const endpoint = "/api/prosecution/court-affidavits";
const inputStyle = "w-full border border-slate-300 bg-white px-2 py-1.5 text-sm";
const buttonStyle = "border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50";
const newAnnexure = (): CourtAnnexure => ({ number: "", description: "", date: "", pages: "", text: "" });
const sourceLink = (id: string) => `/api/evidence/download?id=${encodeURIComponent(id)}&type=original`;
const sections: { heading: string; fields: AffidavitField[] }[] = [
  { heading: "Forwarding memo", fields: ["from", "to", "memo", "memoDate", "subject", "forwarding"] },
  { heading: "Court heading and parties", fields: ["court", "petition", "petitionSection", "relief", "petitioner", "partyRole", "father", "respondent", "title", "intro", "fir", "firDate", "complaint", "station", "sections", "hearing"] },
  { heading: "Affidavit", fields: ["preliminary", "priorFiling", "order", "compliance", "facts", "role", "custody", "stage", "trial", "antecedents", "grounds", "paraWise", "prayer", "verification", "deponent", "capacity", "place", "date", "indexPages"] },
];
const narrative = new Set<AffidavitField>(["forwarding", "intro", "preliminary", "priorFiling", "order", "compliance", "facts", "role", "custody", "trial", "antecedents", "grounds", "paraWise", "prayer", "verification"]);

async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || "Court document request failed.");
  return data;
}

export async function listCourtAffidavits<T extends RecordItem>(kind: Kind, legacy: T[]): Promise<T[]> {
  const { records } = await request(`${endpoint}?kind=${kind}`) as { records: T[] };
  const ids = new Set(records.map(record => record.id));
  return [...records, ...legacy.filter(record => !ids.has(record.id))];
}

export async function removeCourtAffidavit(kind: Kind, id: string) {
  await request(`${endpoint}?kind=${kind}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

function legacyFields(record?: RecordItem): AffidavitFields {
  if (!record) return {};
  const common = { fir: record.firNumber, station: record.policeStation, court: record.courtName, hearing: record.hearingDate, date: record.submissionDate };
  return "bailType" in record
    ? { ...common, petition: record.applicationNo, petitioner: record.applicantAccusedName, father: record.fatherName, sections: record.ipcOrBnsSections, facts: record.ioCaseSummary, grounds: record.groundsOfOpposition.join("\n"), antecedents: record.antecedentsDetails, deponent: record.submittedByOfficer }
    : { ...common, memo: record.reportRefNo, petition: record.petitionNumber, title: record.caseTitle, facts: record.keyEvidenceCollected, custody: record.accusedStatus, stage: record.investigationStage?.replaceAll("_", " "), prayer: record.policePrayer, deponent: record.submittedBy };
}

function DraftBlock({ block }: { block: AffidavitBlock }) {
  const [head, ...rows] = block.table.trim() ? block.table.replace(/[\r\n]+$/, "").split(/\r?\n/).map(row => row.split("\t")) : [];
  const columns = head ? Array.from({ length: Math.max(head.length, ...rows.map(row => row.length)) }, (_, index) => index) : [];
  return <div className="space-y-2">
    {block.heading && <h3 className="font-bold">{block.heading}</h3>}
    {block.text && <p>{block.text}</p>}
    {head && <table>
      <thead><tr>{columns.map(index => <th key={index}>{head[index]}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{columns.map(column => <td key={column}>{row[column]}</td>)}</tr>)}</tbody>
    </table>}
  </div>;
}

function AffidavitPreview({ draft }: { draft: CourtAffidavit }) {
  const f = draft.fields;
  const caption = <><h2 className="text-center font-bold uppercase">{f.court}</h2><p className="text-right font-bold">{f.petition}</p>
    <p>{f.petitioner}{f.petitioner && <span className="float-right">{f.partyRole || "Petitioner"}</span>}</p>{f.father && <p>{f.father}</p>}
    {(f.petitioner || f.respondent) && <p className="text-center font-bold">Versus</p>}
    <p>{f.respondent}{f.respondent && <span className="float-right">Respondent</span>}</p></>;
  const paragraphs: AffidavitField[] = ["priorFiling", "order", "compliance", "facts", "role", "custody", "stage", "trial", "antecedents", "grounds"];
  const signature = <div className="flex justify-between gap-4"><div>{f.date && <div>Date: {f.date}</div>}{f.place && <div>Place: {f.place}</div>}</div><div className="min-w-32 text-right">{f.deponent}{f.capacity && <div>{f.capacity}</div>}</div></div>;
  const blocks = draft.blocks || [];
  const annexures = [...draft.annexures.filter(row => !row.vernacular), ...draft.annexures.filter(row => row.vernacular)];
  const vernacularStart = annexures.findIndex(row => row.vernacular);
  return <div className="court-affidavit-print space-y-4 text-black">
    <style>{`
      .court-affidavit-print .court-sheet { background: white; width: min(100%, 210mm); margin-inline: auto; padding: 13mm 16mm; font: 12pt/1.65 "Times New Roman", serif; white-space: pre-wrap; overflow-wrap: anywhere; }
      .court-affidavit-print .court-sheet + .court-sheet { margin-top: 12px; }
      .court-affidavit-print table { width: 100%; border-collapse: collapse; }
      .court-affidavit-print th, .court-affidavit-print td { border: 1px solid black; padding: 3px 7px; text-align: left; vertical-align: top; }
      @media screen { .court-affidavit-print .court-sheet { min-height: 297mm; } }
      @media print { .court-affidavit-print .court-sheet { width: auto; padding: 0 6mm; margin: 0; } .court-affidavit-print .court-sheet + .court-sheet { break-before: page; margin: 0; } .court-affidavit-print tr { break-inside: avoid; } }
    `}</style>
    {(["from","to","memo","memoDate","subject","forwarding"] as const).some(key => f[key]) && <section className="court-sheet space-y-4">
      {f.from && <p>From{"\n"}{f.from}</p>}{f.to && <p>To{"\n"}{f.to}</p>}
      <p>{f.memo && `Memo No. ${f.memo}`}{f.memoDate && `    Dated ${f.memoDate}`}</p>
      {f.subject && <p><strong>Subject:</strong> {f.subject}</p>}{f.forwarding && <p>{f.forwarding}</p>}
      {f.deponent && <p className="text-right">{f.deponent}</p>}
    </section>}
    {(f.title || f.indexPages || draft.annexures.length > 0) && <section className="court-sheet space-y-4">
      {caption}<h3 className="text-center font-bold">INDEX</h3>
      <table><thead><tr>{["S. No.", "Particulars", "Date", "Page No."].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>
          <tr><td>1</td><td>{f.title}</td><td>{f.date}</td><td>{f.indexPages}</td></tr>
          {annexures.flatMap((row, index) => {
            const item = <tr key={index}><td>{index + 2}</td><td>{[row.number, row.description].filter(Boolean).join(" — ")}</td><td>{row.date}</td><td>{row.pages}</td></tr>;
            return index === vernacularStart ? [<tr key="vernaculars"><th colSpan={4}>Vernaculars</th></tr>, item] : [item];
          })}
        </tbody>
      </table>{signature}
    </section>}
    <section className="court-sheet space-y-4">
      {caption}<h3 className="text-center font-bold uppercase">{f.title}</h3>
      <p>{[f.fir && `FIR No. ${f.fir}`, f.firDate, f.complaint && `Complaint: ${f.complaint}`, f.station, f.sections, f.hearing && `Petition hearing: ${f.hearing}`].filter(Boolean).join(" • ")}</p>
      {f.intro && <p>{f.intro}</p>}
      {(f.petitionSection || f.relief) && <p>{[f.petitionSection, f.relief].filter(Boolean).join("\n")}</p>}
      {f.preliminary && <div><h3 className="font-bold">Preliminary Submissions</h3><p>{f.preliminary}</p></div>}
      <ol className="list-decimal space-y-3 pl-6">{paragraphs.filter(key => f[key]).map(key => <li key={key}>
        {f[key]}
        {key === "facts" && blocks.map((block, index) => block.afterFacts && <DraftBlock key={index} block={block} />)}
      </li>)}</ol>
      {blocks.map((block, index) => (!block.afterFacts || !f.facts) && <DraftBlock key={index} block={block} />)}
      {f.paraWise && <div><h3 className="font-bold">Para-wise Reply</h3><p>{f.paraWise}</p></div>}
      {f.prayer && <p>{f.prayer}</p>}{signature}
      {f.verification && <div className="space-y-3"><h3 className="font-bold">Verification</h3><p>{f.verification}</p>{signature}</div>}
    </section>
    {annexures.filter(row => row.text.trim()).map((row, index) => <section className="court-sheet space-y-4" key={index}>
      <h3 className="text-center font-bold">{[row.number, row.description].filter(Boolean).join(" — ")}</h3><p>{row.text}</p>
    </section>)}
  </div>;
}

export function CourtAffidavitEditor({ kind, record, onClose, onSaved }: { kind: Kind; record?: RecordItem; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<CourtAffidavit>(() => record?.affidavit ?? { firId: "", fields: legacyFields(record), annexures: [], sources: {} });
  const [firs, setFirs] = useState<FirOption[]>([]);
  const [complaints, setComplaints] = useState<{ id: string; complaintNumber: string }[]>([]);
  const [documents, setDocuments] = useState<Source[]>([]);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [choosingType, setChoosingType] = useState(false);
  const [category, setCategory] = useState(record ? ("bailType" in record ? record.bailType : record.reportType || "") : "");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [draftId] = useState(() => record?.id || `court-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    request("/api/fir/records").then(({ records }: { records: FirOption[] }) => {
      if (!active) return;
      setFirs(records);
      if (record && !record.affidavit) {
        const matches = records.filter(fir => fir.firNumber === record.firNumber && fir.policeStation === record.policeStation);
        if (matches.length === 1) setDraft(current => ({ ...current, firId: current.firId || matches[0].id }));
      }
    }).catch(error => { if (active) setNotice(error.message); });
    if (kind === "status") request("/api/complaints").then(data => {
      if (active) setComplaints(data.complaints || []);
    }).catch(error => { if (active) setNotice(error.message); });
    return () => { active = false; };
  }, [kind, record]);

  const post = (body: object) => request(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  useEffect(() => {
    let active = true;
    setDocuments([]);
    if (draft.firId) void post({ action: "sources", firId: draft.firId, kind }).then(data => {
      if (active) setDocuments(data.documents);
    }).catch(error => { if (active) setNotice(error.message); });
    return () => { active = false; };
  }, [draft.firId, kind]);

  function changeField(key: AffidavitField, value: string) {
    setDraft(current => {
      const sources = { ...current.sources };
      delete sources[key];
      return { ...current, sources, fields: { ...current.fields, [key]: value } };
    });
  }

  async function prepare() {
    setBusy("Reading saved FIR and processed documents…");
    setNotice("");
    try {
      const data = await post({ action: "prepare", firId: draft.firId, kind, category, basic: draft.fields });
      setDocuments(data.documents);
      setDraft(current => {
        const fields = { ...current.fields }, sources = { ...current.sources };
        for (const [key, value] of Object.entries(data.fields as AffidavitFields) as [AffidavitField, string][]) {
          if (fields[key]?.trim() || !value) continue;
          fields[key] = value;
          sources[key] = data.sources[key] || { id: "", name: draft.firId.startsWith("complaint:") ? "Saved complaint" : "Saved FIR" };
        }
        for (const [key, value] of Object.entries(data.draftFields || {}) as [AffidavitField, string][]) {
          if (!fields[key]?.trim() && value) fields[key] = value;
        }
        return { ...current, fields, sources, blocks: current.blocks?.length ? current.blocks : data.draftBlocks, promptVersion: data.promptVersion };
      });
      setNotice(data.warning || "Available source fields filled. Review the draft before saving.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Autofill failed."); }
    finally { setBusy(""); }
  }

  async function upload(files: File[]) {
    if (!files.length) return;
    setBusy("Processing uploads…");
    setNotice("");
    const failures: string[] = [];
    try {
      for (const file of files) {
        const form = new FormData();
        form.set("file", file); form.set("caseId", draft.firId);
        try { await request(endpoint, { method: "POST", body: form }); }
        catch (error) { failures.push(`${file.name}: ${error instanceof Error ? error.message : "Processing failed"}`); }
      }
      const data = await post({ action: "sources", firId: draft.firId, kind });
      setDocuments(data.documents);
      setNotice(failures.length ? failures.join("\n") : "Uploads processed and saved to the case. Use Autofill to reuse them.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not refresh saved evidence."); }
    finally { setBusy(""); }
  }

  async function save() {
    setBusy("Saving…");
    setNotice("");
    try {
      await post({ action: "save", kind, id: draftId, category, affidavit: draft });
      onSaved();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Save failed."); }
    finally { setBusy(""); }
  }

  function editAnnexure(index: number, change: Partial<CourtAnnexure>) {
    setDraft(current => ({ ...current, annexures: current.annexures.map((row, i) => i === index ? { ...row, ...change } : row) }));
  }

  function editBlock(index: number, change: Partial<AffidavitBlock>) {
    setDraft(current => ({ ...current, blocks: current.blocks?.map((block, i) => i === index ? { ...block, ...change } : block) }));
  }

  const title = kind === "bail" ? "Draft Police Bail Reply" : "Draft Court Status Report";
  const categories = kind === "bail" ? bailReplyTypes : statusReportTypes;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
    <section role="dialog" aria-modal="true" aria-labelledby="court-affidavit-title" className="flex max-h-[94vh] w-full max-w-5xl flex-col border bg-white shadow-xl">
      <header className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
        <h2 id="court-affidavit-title" className="font-bold text-[#203c88]">{title}</h2>
        <button type="button" aria-label="Close" disabled={!!busy} onClick={onClose}><X className="h-5 w-5" /></button>
      </header>
      <div className="flex flex-wrap items-end gap-2 border-b px-4 py-2">
        <label className="min-w-48 text-xs">{kind === "bail" ? "Select FIR" : "Select FIR or complaint"}<select className={inputStyle} value={draft.firId} disabled={!!busy || !!record?.affidavit} onChange={event => {
          const id = event.target.value;
          if (draft.firId && Object.values(draft.fields).some(Boolean) && !confirm("Switch case and clear this draft?")) return;
          setDraft(current => ({ firId: id, fields: current.firId ? {} : current.fields, sources: {}, annexures: [] }));
          setNotice("");
        }}><option value="">Select case</option>{firs.map(fir => <option key={fir.id} value={fir.id}>{fir.firNumber} · {fir.policeStation}</option>)}
          {complaints.map(complaint => <option key={complaint.id} value={`complaint:${complaint.id}`}>Complaint {complaint.complaintNumber}</option>)}</select></label>
        <label className="text-xs">Draft type<select className={inputStyle} value={category} disabled={!!busy} onChange={event => setCategory(event.target.value)}>
          <option value="">Choose type</option>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select></label>
        <button type="button" className={buttonStyle} disabled={!draft.firId || !!busy} onClick={() => void prepare()}>Autofill from processed data</button>
        <label className="text-xs">Upload and process<input type="file" multiple className="block max-w-56 text-xs" disabled={!draft.firId || !!busy} onChange={event => {
          const files = Array.from(event.target.files || []); event.target.value = ""; void upload(files);
        }} /></label>
        <button type="button" className={buttonStyle} onClick={() => setMode(mode === "edit" ? "preview" : "edit")}>{mode === "edit" ? "A4 Preview" : "Back to Edit"}</button>
        {mode === "preview" && <button type="button" className={buttonStyle} onClick={() => { if (printRef.current) printA4Element(printRef.current, title); }}>Print / PDF</button>}
      </div>
      {(busy || notice) && <p role="status" className="whitespace-pre-wrap px-4 py-2 text-xs text-slate-700">{busy || notice}</p>}
      <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-4">
        {mode === "preview" ? <div ref={printRef}><AffidavitPreview draft={draft} /></div> :
          <fieldset disabled={!!busy} className="space-y-4">
            {sections.map(section => <section key={section.heading} className="border bg-white p-3">
              <h3 className="mb-2 text-sm font-bold text-[#203c88]">{section.heading}</h3>
              <div className="grid gap-2 sm:grid-cols-2">{section.fields.map(key => {
                const source = draft.sources[key], value = draft.fields[key] || "";
                const style = `${inputStyle} ${source ? "!border-emerald-500 ring-1 ring-emerald-300" : ""}`;
                return <label key={key} className={`block text-xs font-semibold ${narrative.has(key) ? "sm:col-span-2" : ""}`}>
                  {affidavitLabels[key]}
                  {narrative.has(key) ? <textarea rows={3} className={style} value={value} onChange={event => changeField(key, event.target.value)} />
                    : <input className={style} value={value} onChange={event => changeField(key, event.target.value)} />}
                  {source && <span className="text-emerald-800">{source.id ? <a href={sourceLink(source.id)} target="_blank" rel="noreferrer" className="underline">{source.name}</a> : source.name}</span>}
                </label>;
              })}</div>
            </section>)}
            <section className="space-y-2 border bg-white p-3">
              <h3 className="text-sm font-bold text-[#203c88]">Additional sections and tables</h3>
              {draft.blocks?.map((block, index) => <div key={index} className="space-y-2 border p-2">
                <label className="block text-xs">Heading<input className={inputStyle} value={block.heading} onChange={event => editBlock(index, { heading: event.target.value })} /></label>
                <label className="block text-xs">Text<textarea className={inputStyle} rows={2} value={block.text} onChange={event => editBlock(index, { text: event.target.value })} /></label>
                <label className="block text-xs">Table (paste Excel cells, with headers in the first row)<textarea className={inputStyle} rows={3} value={block.table} onChange={event => editBlock(index, { table: event.target.value })} /></label>
                <label className="mr-4 text-xs"><input type="checkbox" checked={!!block.afterFacts} onChange={event => editBlock(index, { afterFacts: event.target.checked })} /> Place after case facts</label>
                <button type="button" className="text-xs text-red-700" onClick={() => setDraft(current => ({ ...current, blocks: current.blocks?.filter((_, i) => i !== index) }))}>Remove section</button>
              </div>)}
              <button type="button" className={buttonStyle} onClick={() => setDraft(current => ({ ...current, blocks: [...(current.blocks || []), { heading: "", text: "", table: "" }] }))}>Add section or table</button>
            </section>
            <section className="space-y-2 border bg-white p-3">
              <h3 className="text-sm font-bold text-[#203c88]">Annexure index</h3>
              {draft.annexures.map((row, index) => <div key={index} className="space-y-2 border p-2">
                <div className="grid gap-2 sm:grid-cols-4">{(["number", "description", "date", "pages"] as const).map(key => <label key={key} className="text-xs capitalize">{key}<input className={inputStyle} value={row[key]} onChange={event => editAnnexure(index, { [key]: event.target.value })} /></label>)}</div>
                <label className="block text-xs">Annexure text<textarea className={inputStyle} rows={2} value={row.text} onChange={event => editAnnexure(index, { text: event.target.value })} /></label>
                <label className="mr-3 text-xs"><input type="checkbox" checked={!!row.vernacular} onChange={event => editAnnexure(index, { vernacular: event.target.checked })} /> Vernacular copy</label>
                {row.sourceId && <><label className="mr-3 text-xs">Original PDF page(s) <input className="w-20 border px-1" value={row.sourcePages || ""} onChange={event => editAnnexure(index, { sourcePages: event.target.value })} /></label>
                  <a href={sourceLink(row.sourceId)} target="_blank" rel="noreferrer" className="mr-3 text-xs underline">Download original</a></>}
                <button type="button" className="text-xs text-red-700" onClick={() => setDraft(current => ({ ...current, annexures: current.annexures.filter((_, i) => i !== index) }))}>Remove</button>
              </div>)}
              <button type="button" className={buttonStyle} onClick={() => setDraft(current => ({ ...current, annexures: [...current.annexures, newAnnexure()] }))}>Add annexure row</button>
              <select aria-label="Add saved document as annexure" className={inputStyle} value="" disabled={!documents.length} onChange={event => {
                const source = documents.find(doc => doc.id === event.target.value);
                if (source) setDraft(current => ({ ...current, annexures: [...current.annexures, { ...newAnnexure(), description: source.name, sourceId: source.id }] }));
              }}><option value="">Add a processed source to index</option>{documents.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}</select>
            </section>
          </fieldset>}
      </div>
      <footer className="flex flex-wrap items-end justify-end gap-2 border-t p-3">
        <button type="button" className={buttonStyle} disabled={!!busy} onClick={choosingType ? () => setChoosingType(false) : onClose}>Cancel</button>
        {choosingType && <label className="text-xs">{kind === "bail" ? "Bail reply type" : "Status report type"}
          <select className={inputStyle} disabled={!!busy} value={category} onChange={event => setCategory(event.target.value)}>
            <option value="">Select type</option>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select></label>}
        {choosingType && category === "OTHER" && <label className="text-xs">Custom type<input className={inputStyle} maxLength={150} value={draft.customType || ""} onChange={event => setDraft(current => ({ ...current, customType: event.target.value }))} /></label>}
        <button type="button" disabled={!draft.firId || !!busy || (choosingType && (!category || (category === "OTHER" && !draft.customType?.trim())))} className={`${buttonStyle} bg-[#203c88] text-white`} onClick={() => choosingType ? void save() : setChoosingType(true)}>
          {choosingType ? "Confirm Save" : "Save"}
        </button>
      </footer>
    </section>
  </div>;
}
