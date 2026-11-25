"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { ClipboardList, FileCheck2, ListFilter, Save, Scale, Search } from "lucide-react";
import { formGroups, requiredField, uploadFields, visibleField, type Attachment, type Entry, type Field, type Group, type IifViRecord, type IifViStage, type Values } from "@/lib/iifVi";

type FirSummary = { id: string; number: string; date: string; station: string; district: string; year: number };
type FirDetail = FirSummary & {
  complainant: string; chargeSheetNo: string; chargeSheetDate: string; courtName: string; io: string;
  accused: { name: string; relativeName: string; age: string; alias: string; address: string; phone: string }[];
  tables: Record<string, Values[]>;
};
type RegisterRow = FirSummary & {
  caseNo: string; court: string; hearingCount: number; finalSaved: boolean;
  judgmentDate: string; outcome: string; updatedAt: string; updatedBy: string;
};
type Details = { fir: FirDetail; record: IifViRecord | null };
type Panel = IifViStage | "register";

const endpoint = "/api/prosecution/iif-vi";
const panels = [
  { id: "assign", label: "Assign Court", icon: Scale },
  { id: "trial", label: "Trial Details", icon: ClipboardList },
  { id: "final", label: "Final Form", icon: FileCheck2 },
  { id: "register", label: "Register", icon: ListFilter },
] as const;
const inputStyle = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700";
const buttonStyle = "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50";
const primaryStyle = "inline-flex items-center gap-2 rounded-md bg-[#203c88] px-4 py-2 text-sm font-semibold text-white hover:bg-[#182f70] disabled:opacity-50";
const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
const displayDate = (value: string) => value && Number.isFinite(Date.parse(value)) ? dateFormat.format(new Date(value)) : value || "—";
const message = (error: unknown) => error instanceof Error ? error.message : "Something went wrong.";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || "IIF-VI request failed.");
  return data;
}

function DataTable({ columns, rows, empty }: { columns: string[]; rows: ReactNode[][]; empty: string }) {
  if (!rows.length) return <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#203c88] text-white">
          <tr>{columns.map(column => <th key={column} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">{column}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row, index) => (
            <tr key={index} className="align-top odd:bg-white even:bg-slate-50">
              {row.map((value, cell) => <td key={cell} className="min-w-fit px-3 py-2">{value || "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FieldList({ fields, values, fir, onChange }: { fields: Field[]; values: Values; fir: FirDetail; onChange: (label: string, value: string) => void }) {
  const prefix = useId();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {fields.filter(field => visibleField(field, values)).map((field, index) => {
        const { label, kind, options, custom } = field;
        const id = `${prefix}-${index}`;
        const suggestions = options || (label === "Accused Name" ? [...new Set(fir.accused.map(person => person.name).filter(Boolean))] : label === "Name of the IO" && fir.io ? [fir.io] : []);
        const props = {
          id, value: values[label] || "", className: inputStyle, "aria-required": requiredField(field, values),
          onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(label, event.target.value),
        };
        return (
          <label key={label} htmlFor={id} className={`block space-y-1 text-sm font-medium text-slate-700 ${kind === "area" ? "sm:col-span-2" : ""}`}>
            <span>{label}{requiredField(field, values) && <span className="ml-1 text-red-700">*</span>}</span>
            {options && !custom ? (
              <select {...props}><option value="">Select</option>{options.map(option => <option key={option}>{option}</option>)}</select>
            ) : kind === "area" ? <textarea {...props} rows={3} maxLength={4000} /> : (
              <>
                <input {...props} type={kind || "text"} min={kind === "number" ? 0 : undefined}
                  step={kind === "number" ? (label.endsWith("(Rs.)") ? "0.01" : "1") : undefined}
                  maxLength={4000} list={suggestions.length ? `${id}-options` : undefined} />
                {suggestions.length > 0 && <datalist id={`${id}-options`}>{suggestions.map(option => <option key={option} value={option} />)}</datalist>}
              </>
            )}
          </label>
        );
      })}
    </div>
  );
}

function TableGroup({ group, rows, fir, onChange }: { group: Group; rows: Values[]; fir: FirDetail; onChange: (rows: Values[]) => void }) {
  const [editing, setEditing] = useState<number | null>(null);
  const columns = group.columns || group.fields.map(field => field.label);
  function setValue(index: number, label: string, value: string) {
    const person = label === "Accused Name" ? fir.accused.find(item => item.name === value) : undefined;
    const previous = rows[index];
    const prefilled: Values = {};
    if (person) {
      const source: Values = { "Relative Name": person.relativeName, "Age (Years)": person.age, Alias: person.alias, Address: person.address, "Mobile No.": person.phone };
      for (const field of group.fields) {
        if (!previous[field.label] && source[field.label]) prefilled[field.label] = source[field.label];
      }
    }
    onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...prefilled, [label]: value } : row));
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-900">{group.title}</h3>
      <DataTable columns={["S.No.", ...columns, ...(group.source ? [] : ["Actions"])]} empty="No rows"
        rows={rows.map((row, index) => [index + 1, ...columns.map(column => row[column]), ...(!group.source ? [
          <div key="actions" className="flex gap-2">
            <button type="button" className={buttonStyle} onClick={() => setEditing(index)}>Edit</button>
            <button type="button" className={buttonStyle} onClick={() => {
              onChange(rows.filter((_, rowIndex) => rowIndex !== index));
              setEditing(null);
            }}>Remove</button>
          </div>,
        ] : [])])} />
      {editing !== null && rows[editing] && (
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <FieldList fields={group.fields} values={rows[editing]} fir={fir} onChange={(label, value) => setValue(editing, label, value)} />
          <button type="button" className={buttonStyle} onClick={() => setEditing(null)}>Done editing row</button>
        </div>
      )}
      {!group.source && <button type="button" className={buttonStyle} disabled={rows.length >= 100}
        onClick={() => { onChange([...rows, {}]); setEditing(rows.length); }}>Add row</button>}
    </section>
  );
}

function newEntry(stage: IifViStage, fir: FirDetail): Entry {
  if (stage === "assign") return {
    values: {
      "Charge Sheet No.": fir.chargeSheetNo, "Court Name": fir.courtName,
      "Case is Transferred": "No", "Acknowledgement Details": "Final", "Case Type": "Not Applicable (NA)",
    },
    tables: {},
  };
  return { values: {}, tables: {} };
}

function CaseHeader({ stage, fir, record }: { stage: IifViStage; fir: FirDetail; record: IifViRecord | null }) {
  const assignment = record?.assign?.entries[0]?.values;
  const header = [
    ["FIR No.", fir.number], ["FIR Date", displayDate(fir.date)], ["Police Station", fir.station], ["District", fir.district], ["Year", fir.year],
    ["Complainant Name", fir.complainant], ["Charge Sheet No.", assignment?.["Charge Sheet No."] || fir.chargeSheetNo],
    ["Charge Sheet Date", displayDate(fir.chargeSheetDate)],
    ...(stage === "assign" ? [] : [
      ["Court Type", assignment?.["Court Type"]], ["Court Name", assignment?.["Court Name"]],
      ["Court Case No.", assignment?.["Court Case No."]], ["Date of Framing Charges", displayDate(assignment?.["Date of Framing Charges"] || "")],
      ...(stage === "trial" ? [["Case Type", record?.final?.entries[0]?.values["Case Type"] || assignment?.["Case Type"]]] : []),
    ]),
  ];
  return (
    <dl className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      {header.map(([label, value]) => (
        <div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value || "—"}</dd></div>
      ))}
    </dl>
  );
}

function Editor({ stage, details, onSave, setDirty, saving, setSaving }: {
  stage: IifViStage; details: Details; onSave: (record: IifViRecord, label: string) => void;
  setDirty: (dirty: boolean) => void; saving: boolean; setSaving: (saving: boolean) => void;
}) {
  const { fir, record } = details;
  const saved = record?.[stage];
  const [entries, setEntries] = useState<Entry[]>(() => saved?.entries || [newEntry(stage, fir)]);
  const [index, setIndex] = useState(0);
  const [uploads, setUploads] = useState<Record<string, File | null>>({});
  const [error, setError] = useState("");
  const entry = entries[index];

  function updateEntry(next: Entry) {
    setEntries(current => current.map((existing, entryIndex) => entryIndex === index ? next : existing));
    setDirty(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      const attachments: Record<string, Attachment | null> = {};
      for (const [label, file] of Object.entries(uploads)) {
        if (!file) { attachments[label] = null; continue; }
        const bytes = new Uint8Array(await file.arrayBuffer());
        const chunks: string[] = [];
        for (let offset = 0; offset < bytes.length; offset += 8192) {
          chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)));
        }
        attachments[label] = { name: file.name, data: btoa(chunks.join("")) };
      }
      const result = await request<{ record: IifViRecord }>(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firId: fir.id, revision: record?.revision, stage, entries, attachments }),
      });
      setEntries(result.record[stage]!.entries);
      setUploads({});
      setDirty(false);
      onSave(result.record, panels.find(panel => panel.id === stage)!.label);
    } catch (error) {
      setError(message(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <CaseHeader stage={stage} fir={fir} record={record} />
      {stage !== "assign" && !record?.assign ? (
        <p className="rounded-md border border-slate-200 bg-white p-4 text-sm">Save Assign Court for this FIR to open {stage === "trial" ? "Trial Details" : "Final Form"}.</p>
      ) : (
        <form onSubmit={save}>
          <fieldset disabled={saving} className="space-y-4">
            {stage === "trial" && (
              <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-4">
                <label className="space-y-1 text-sm font-medium">Hearing
                  <select className={inputStyle} value={index} onChange={event => setIndex(Number(event.target.value))}>
                    {entries.map((item, i) => <option key={i} value={i}>Hearing {i + 1}{item.values["Date of Hearing"] ? ` · ${displayDate(item.values["Date of Hearing"])}` : ""}</option>)}
                  </select>
                </label>
                <button type="button" className={buttonStyle} disabled={entries.length >= 100}
                  onClick={() => { setEntries([...entries, newEntry(stage, fir)]); setIndex(entries.length); setDirty(true); }}>Add hearing</button>
                {entries.length > 1 && index >= (saved?.entries.length || 0) && (
                  <button type="button" className={buttonStyle}
                    onClick={() => { setEntries(entries.filter((_, i) => i !== index)); setIndex(index - 1); setDirty(true); }}>Remove unsaved hearing</button>
                )}
              </div>
            )}
            {stage === "assign" && saved && (
              <DataTable columns={["S.No.", "Charge Sheet No.", "Case No.", "Court Type", "Court Name", "Date of Framing Charges"]}
                rows={saved.entries.map(({ values }, i) => [i + 1, values["Charge Sheet No."], values["Court Case No."], values["Court Type"], values["Court Name"], displayDate(values["Date of Framing Charges"] || "")])}
                empty="No court assignment saved." />
            )}
            {formGroups[stage].map(group => group.table ? (
              <TableGroup key={`${index}-${group.title}`} group={group} fir={fir}
                rows={(group.source ? fir.tables[group.table] : entry.tables[group.table]) || []}
                onChange={rows => updateEntry({ ...entry, tables: { ...entry.tables, [group.table!]: rows } })} />
            ) : (
              <section key={group.title} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="font-semibold">{group.title}</h3>
                <FieldList fields={group.fields} fir={fir} values={entry.values}
                  onChange={(label, value) => updateEntry({ ...entry, values: { ...entry.values, [label]: value } })} />
              </section>
            ))}
            {uploadFields[stage].length > 0 && (
              <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
                {uploadFields[stage].map(label => {
                  const attachment = uploads[label] === undefined ? saved?.attachments[label] : null;
                  return (
                    <div key={label} className="space-y-2">
                      <label className="block space-y-1 text-sm font-medium">
                        <span>{label}{label === "Court Disposal Form" && <span className="ml-1 text-red-700">*</span>}</span>
                        <input key={saved?.updatedAt || "new"} className={inputStyle} type="file" onChange={event => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          if (!file.size || file.size > 5 * 1024 * 1024 || file.name.length > 240) {
                            setError("Choose a non-empty file up to 5 MB with a filename of 240 characters or fewer.");
                            event.target.value = "";
                            return;
                          }
                          setError("");
                          setUploads(current => ({ ...current, [label]: file }));
                          setDirty(true);
                        }} />
                      </label>
                      {attachment && (
                        <div className="flex flex-wrap items-center gap-2">
                          <a className="break-all text-sm text-blue-800 underline" href={`${endpoint}?${new URLSearchParams({ firId: fir.id, stage, attachment: label })}`}>{attachment.name}</a>
                          <button type="button" className={buttonStyle} onClick={() => { setUploads(current => ({ ...current, [label]: null })); setDirty(true); }}>Remove file</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}
            {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <button type="submit" className={primaryStyle}><Save size={16} />{saving ? "Saving…" : `Save ${panels.find(panel => panel.id === stage)!.label}`}</button>
          </fieldset>
        </form>
      )}
    </div>
  );
}

export function IifViWorkspace() {
  const [panel, setPanel] = useState<Panel>("assign");
  const [firs, setFirs] = useState<FirSummary[]>([]);
  const [register, setRegister] = useState<RegisterRow[]>([]);
  const [details, setDetails] = useState<Details | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    request<{ firs: FirSummary[]; register: RegisterRow[] }>(panel === "register" ? `${endpoint}?register=1` : endpoint, { signal: controller.signal })
      .then(data => { setFirs(data.firs); setRegister(data.register); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); })
      .finally(() => { if (!controller.signal.aborted) setListLoading(false); });
    return () => controller.abort();
  }, [panel, reload]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function selectPanel(next: Panel) {
    if (next === panel || saving || opening || (dirty && !window.confirm("Leave this panel and discard unsaved changes?"))) return;
    setDirty(false);
    setError("");
    setNotice("");
    setListLoading(true);
    setPanel(next);
  }

  async function openFir(id: string, next?: Panel) {
    if (opening || saving || (dirty && !window.confirm("Open this FIR and discard unsaved changes?"))) return;
    setOpening(true);
    setError("");
    setNotice("");
    try {
      const result = await request<Details>(`${endpoint}?${new URLSearchParams({ firId: id })}`);
      setDetails(result);
      setEditorVersion(value => value + 1);
      setDirty(false);
      if (next) {
        setListLoading(true);
        setPanel(next);
      }
    } catch (error) {
      setError(message(error));
    } finally {
      setOpening(false);
    }
  }

  const source = panel === "register" ? register : firs;
  const text = query.trim().toLowerCase();
  const filtered = source.filter(row => {
    const saved = "court" in row ? row as RegisterRow : undefined;
    return [row.number, row.station, row.district, saved?.court, saved?.caseNo].some(value => value?.toLowerCase().includes(text))
      && (!from || row.date >= from) && (!to || row.date <= to);
  });

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 text-slate-900 sm:p-6 lg:p-8">
      <header className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <ClipboardList size={36} className="rounded-md bg-[#203c88] p-2 text-white" />
        <h1 className="text-2xl font-bold text-[#203c88]">IIF-VI</h1>
      </header>
      <nav aria-label="IIF-VI panels" className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {panels.map(({ id, label, icon: Icon }) => (
          <button type="button" key={id} aria-pressed={panel === id} disabled={opening || saving}
            className={panel === id ? primaryStyle : `inline-flex items-center gap-2 ${buttonStyle}`} onClick={() => selectPanel(id)}>
            <Icon size={16} />{label}
          </button>
        ))}
      </nav>
      <section aria-label={panel === "register" ? "Filter register" : "Find FIR"} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-48 flex-1 space-y-1 text-sm font-medium">
            <span className="flex items-center gap-2"><Search size={15} />{panel === "register" ? "Search register" : "Search FIR"}</span>
            <input className={inputStyle} value={query} onChange={event => setQuery(event.target.value)} placeholder={panel === "register" ? "FIR number, court, or police station" : "FIR number or police station"} />
          </label>
          <label className="space-y-1 text-sm font-medium">FIR date from<input className={inputStyle} type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
          <label className="space-y-1 text-sm font-medium">FIR date to<input className={inputStyle} type="date" min={from || undefined} value={to} onChange={event => setTo(event.target.value)} /></label>
          <button type="button" className={buttonStyle} onClick={() => { setQuery(""); setFrom(""); setTo(""); }}>Clear filters</button>
        </div>
        {listLoading ? <p role="status" className="text-sm text-slate-600">Loading {panel === "register" ? "register" : "FIRs"}…</p> : panel === "register" ? (
          <DataTable columns={["FIR No.", "Police Station", "Court Case No.", "Court Name", "Hearings", "Final Form", "Judgment Date", "Disposal", "Updated", "Updated By", "Actions"]}
            empty="No saved IIF-VI records match the filters."
            rows={(filtered as RegisterRow[]).map(row => [
              row.number, row.station, row.caseNo, row.court, String(row.hearingCount), row.finalSaved ? "Filed" : "Pending",
              displayDate(row.judgmentDate), row.outcome, displayDate(row.updatedAt), row.updatedBy,
              <button type="button" key="open" className={buttonStyle} disabled={opening} onClick={() => void openFir(row.id, row.finalSaved ? "final" : row.hearingCount ? "trial" : "assign")}>Open</button>,
            ])} />
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <label className="block min-w-48 flex-1 space-y-1 text-sm font-medium">Select FIR
              <select className={inputStyle} value={filtered.some(row => row.id === details?.fir.id) ? details?.fir.id : ""} disabled={opening || saving}
                onChange={event => { if (event.target.value) void openFir(event.target.value); }}>
                <option value="" disabled>{filtered.length ? "Select a FIR" : "No matching FIRs"}</option>
                {filtered.map(row => <option key={row.id} value={row.id}>{row.number} · {row.station} · {row.district}</option>)}
              </select>
            </label>
            {details && <button type="button" className={buttonStyle} disabled={opening || saving} onClick={() => void openFir(details.fir.id)}>Reload FIR</button>}
          </div>
        )}
      </section>
      {opening && <p role="status" className="text-sm text-slate-600">Opening FIR…</p>}
      {error && <div role="alert" className="flex items-center gap-3 rounded-md bg-red-50 p-3 text-sm text-red-800">
        {error}<button type="button" className={buttonStyle} onClick={() => { setError(""); setListLoading(true); setReload(value => value + 1); }}>Reload list</button>
      </div>}
      {notice && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
      {panel !== "register" && details && (
        <Editor key={`${details.fir.id}-${panel}-${editorVersion}`} stage={panel} details={details} setDirty={setDirty} saving={saving || opening} setSaving={setSaving}
          onSave={(record, label) => { setDetails({ ...details, record }); setNotice(`${label} saved for ${details.fir.number}.`); }} />
      )}
    </main>
  );
}
