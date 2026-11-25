"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { ClipboardList, FileCheck2, ListFilter, Save, Search } from "lucide-react";
import {
  appealFields, fileFormats, fileTypes, identityFields, maxFileSize, maxTotalSize, outcomeFields, reportSubtypes,
  type AccusedOutcome, type Appeal, type AppealAttachment, type AppealCase, type AppealableFir, type AppealField,
  type AppealRegisterRow, type Values,
} from "@/lib/iifVii";
import { DataTable, buttonStyle, displayDate, inputStyle, message, primaryStyle, request } from "./CourtFormControls";

const endpoint = "/api/prosecution/iif-vii";
const addressColumns = ["S.No.", "Address Type", "Address", "District", "State", "Country"];
const compensationColumns = ["Payable By", "Payable To", "Amount (₹)"];
const actColumns = ["Act", "Sections"];
type Details = { fir: AppealCase; appeals: Appeal[] };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Fields({ schema, values, change }: { schema: AppealField[]; values: Values; change: (label: string, value: string) => void }) {
  const prefix = useId();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {schema.map(({ label, required, kind, options, custom }, i) => {
        const id = `${prefix}-${i}`;
        const title = <>{label}{required && <span className="ml-1 text-red-700">*</span>}</>;
        const value = values[label] || "";
        const props = { id, value, className: inputStyle, "aria-required": required };
        if (kind === "radio") return (
          <fieldset key={label} className="space-y-2 text-sm font-medium text-slate-700">
            <legend>{title}</legend>
            <div className="flex flex-wrap gap-4">
              {options?.map(option => <label key={option} className="flex items-center gap-2">
                <input type="radio" name={id} value={option} checked={value === option} onChange={() => change(label, option)} />{option}
              </label>)}
            </div>
          </fieldset>
        );
        return (
          <label key={label} htmlFor={id} className={`block space-y-1 text-sm font-medium text-slate-700 ${kind === "area" ? "sm:col-span-2" : ""}`}>
            <span>{title}</span>
            {options && !custom ? <select {...props} onChange={event => change(label, event.target.value)}>
              <option value="">Select</option>{options.map(option => <option key={option}>{option}</option>)}
            </select> : kind === "area" ? <textarea {...props} rows={3} maxLength={4000} onChange={event => change(label, event.target.value)} /> : <>
              <input {...props} type={kind || "text"} maxLength={kind ? undefined : 4000}
                min={kind === "number" ? 0 : undefined} step={label.endsWith("(₹)") ? "0.01" : undefined}
                list={options ? id + "-options" : undefined} onChange={event => change(label, event.target.value)} />
              {options && <datalist id={id + "-options"}>{options.map(option => <option key={option} value={option} />)}</datalist>}
            </>}
          </label>
        );
      })}
    </div>
  );
}

function EditableRows({ title, columns, rows, change }: { title: string; columns: string[]; rows: Values[]; change: (rows: Values[]) => void }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <DataTable columns={["S.No.", ...columns, "Remove"]} empty="No rows added."
        rows={rows.map((row, index) => [
          index + 1, ...columns.map(column => <input key={column} className={inputStyle} aria-label={`${title} row ${index + 1} ${column}`}
            value={row[column] || ""} type={column.endsWith("(₹)") ? "number" : "text"} min={column.endsWith("(₹)") ? 0 : undefined}
            step={column.endsWith("(₹)") ? "0.01" : undefined} onChange={event => {
              const value = event.target.value;
              change(rows.map((item, i) => i === index ? { ...item, [column]: value } : item));
            }} />),
          <button type="button" key="remove" className={buttonStyle} onClick={() => change(rows.filter((_, i) => index !== i))}>Remove</button>,
        ])} />
      <button type="button" className={buttonStyle} disabled={rows.length >= 100} onClick={() => change([...rows, {}])}>Add row</button>
    </div>
  );
}

function Attachments({ files, change, firId, appealId }: {
  files: AppealAttachment[]; change: (files: AppealAttachment[]) => void; firId: string; appealId?: string;
}) {
  const [fileType, setFileType] = useState("");
  const [subtype, setSubtype] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [visible, setVisible] = useState(false);

  async function add() {
    if (!file || !fileType || !subtype.trim()) {
      setError("Select a file type and subtype, and choose a file.");
      return;
    }
    if (!file.size || file.size > maxFileSize || file.name.length > 240 || !fileFormats.includes(file.name.split(".").at(-1)?.toLowerCase() || "")) {
      setError("Choose a supported file up to 200 KB.");
      return;
    }
    if (files.reduce((total, item) => total + item.size, file.size) > maxTotalSize) {
      setError("Attachments exceed 1,024 KB in total.");
      return;
    }
    setAdding(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const chunks: string[] = [];
      for (let i = 0; i < bytes.length; i += 8192) chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
      change([...files, { id: crypto.randomUUID(), name: file.name, size: file.size, fileType, subtype: subtype.trim(), description, data: btoa(chunks.join("")) }]);
      setFileKey(key => key + 1);
      setFile(null);
      setDescription("");
      setError("");
    } catch (error) {
      setError(message(error));
    } finally {
      setAdding(false);
    }
  }

  return (
    <Section title="File Upload *">
      <button type="button" className={buttonStyle} onClick={() => setVisible(!visible)} disabled={adding}>{visible ? "Close upload" : "Upload file"}</button>
      {visible && <fieldset disabled={adding} className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm text-slate-600">200 KB per file. 1,024 KB total.</p>
        <Fields schema={[
          { label: "File Type", options: fileTypes, required: true },
          { label: "File Subtype", options: fileType === "Report" ? reportSubtypes : undefined, required: true },
        ]} values={{ "File Type": fileType, "File Subtype": subtype }}
          change={(label, value) => {
            if (label === "File Type") { setFileType(value); setSubtype(""); } else setSubtype(value);
          }} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">Choose File
            <input key={fileKey} type="file" accept={fileFormats.map(format => "." + format).join(",")} className={inputStyle}
              onChange={event => setFile(event.target.files?.[0] || null)} />
          </label>
          <label className="space-y-1 text-sm font-medium">File Description
            <input className={inputStyle} value={description} maxLength={100} onChange={event => setDescription(event.target.value)} />
            <span className="text-xs text-slate-500">{100 - description.length} characters remaining</span>
          </label>
        </div>
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        <button type="button" className={buttonStyle} onClick={() => void add()}>{adding ? "Reading file…" : "Add attachment"}</button>
      </fieldset>}
      <DataTable columns={["File Name", "File Type", "File Subtype", "File Description", "Remove"]} empty="No files attached."
        rows={files.map(item => [
          appealId && !item.data ? <a key="file" className="text-blue-800 underline"
            href={`${endpoint}?${new URLSearchParams({ firId, appealId, attachment: item.id })}`}>{item.name}</a> : item.name,
          item.fileType, item.subtype, item.description,
          <button type="button" key="remove" className={buttonStyle} disabled={adding} onClick={() => change(files.filter(file => file.id !== item.id))}>Remove</button>,
        ])} />
    </Section>
  );
}

function AccusedDetails({ fir, outcomes, change }: {
  fir: AppealCase; outcomes: AccusedOutcome[]; change: (rows: AccusedOutcome[]) => void;
}) {
  const [selected, setSelected] = useState("");
  const people = [...fir.accused, ...outcomes.filter(row => !fir.accused.some(person => person.id === row.personId)).map(row => ({
    id: row.personId, name: row.values["First Name"] || "Previously recorded accused",
    relativeName: row.values["Relative’s Name"] || "", relation: row.values["Relationship Type"] || "", currentAddress: "", permanentAddress: "",
  }))];
  const person = people.find(person => person.id === selected);
  const outcome = outcomes.find(row => row.personId === selected);
  const selectName = useId();

  function select(id: string) {
    setSelected(id);
    if (outcomes.some(row => row.personId === id)) return;
    const person = people.find(row => row.id === id);
    if (!person) return;
    change([...outcomes, {
      personId: id, values: { "First Name": person.name, "Relationship Type": person.relation, "Relative’s Name": person.relativeName },
      compensation: [], acts: fir.acts.filter(row => row.Sections),
    }]);
  }

  function update(next: AccusedOutcome) {
    change(outcomes.map(row => row.personId === selected ? next : row));
  }

  return (
    <Section title="Appeal Outcome Details">
      <DataTable columns={["S.No.", "Select", "Accused Name", "Relationship Type", "Relative’s Name", "Current Address", "Permanent Address", "Appeal Outcome"]}
        empty="No accused are linked to this FIR."
        rows={people.map((person, index) => [
          index + 1,
          <input key="select" type="radio" aria-label={`Edit appeal outcome for ${person.name}`} name={selectName} checked={selected === person.id}
            onChange={() => select(person.id)} />,
          person.name, person.relation, person.relativeName, person.currentAddress, person.permanentAddress,
          outcomes.find(row => row.personId === person.id)?.values["Appeal Outcome"],
        ])} />
      {person && outcome && <div className="space-y-5 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">{person.name}</h3>
          <div className="flex gap-2">
            <button type="button" className={buttonStyle} onClick={() => {
              change(outcomes.filter(row => row.personId !== person.id));
              setSelected("");
            }}>Remove outcome</button>
            <button type="button" className={buttonStyle} onClick={() => setSelected("")}>Done editing</button>
          </div>
        </div>
        <Fields schema={identityFields} values={outcome.values} change={(label, value) => update({ ...outcome, values: { ...outcome.values, [label]: value } })} />
        <DataTable columns={addressColumns} empty="No addresses on the FIR."
          rows={[[1, "Current Residential Address", person.currentAddress, "", "", ""], [2, "Permanent Residential Address", person.permanentAddress, "", "", ""]]} />
        <Fields schema={outcomeFields} values={outcome.values} change={(label, value) => update({ ...outcome, values: { ...outcome.values, [label]: value } })} />
        <EditableRows title="Compensation Details" columns={compensationColumns} rows={outcome.compensation} change={compensation => update({ ...outcome, compensation })} />
        <EditableRows title="Acts and Sections" columns={actColumns} rows={outcome.acts} change={acts => update({ ...outcome, acts })} />
      </div>}
    </Section>
  );
}

function AppealEditor({ fir, initial, dirty, busy, saved }: {
  fir: AppealCase; initial?: Appeal; dirty: (dirty: boolean) => void;
  busy: (saving: boolean) => void; saved: (appeal: Appeal) => void;
}) {
  const [record, setRecord] = useState(initial);
  const [values, setValues] = useState<Values>(() => initial?.values || {
    "Court Case No.": fir.caseNo, "Court Name": fir.court, "Court Type": fir.courtType, "Appellant Party": "State",
  });
  const [accused, setAccused] = useState<AccusedOutcome[]>(initial?.accused || []);
  const [attachments, setAttachments] = useState<AppealAttachment[]>(initial?.attachments || []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    busy(true);
    try {
      const { appeal } = await request<{ appeal: Appeal }>(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firId: fir.id, id: record?.id, revision: record?.revision, values, accused, attachments }),
      });
      setRecord(appeal);
      setValues(appeal.values);
      setAccused(appeal.accused);
      setAttachments(appeal.attachments);
      dirty(false);
      saved(appeal);
    } catch (error) {
      setError(message(error));
    } finally {
      setSaving(false);
      busy(false);
    }
  }

  const header = [
    ["FIR No.", fir.number], ["Registration Date", displayDate(fir.date)], ["Police Station", fir.station],
    ["Court Case No.", values["Court Case No."]], ["Decision Date", displayDate(fir.decisionDate)], ["Decision Type", fir.decisionType],
    ["Charge Sheet No.", fir.chargeSheet], ["Charge Sheet Date", displayDate(fir.chargeSheetDate)],
  ];
  return (
    <form onSubmit={submit}>
      <fieldset disabled={saving} className="space-y-4">
        <Section title="Case Information">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {header.map(([label, value]) => <div key={label}>
              <dt className="text-xs font-semibold text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm font-medium">{value || "—"}</dd>
            </div>)}
          </dl>
        </Section>
        <Section title="Court Appeal Form">
          <Fields schema={[{ label: "Court Case No.", required: true }, ...appealFields]} values={values}
            change={(label, value) => { setValues(current => ({ ...current, [label]: value })); dirty(true); }} />
        </Section>
        <Attachments firId={fir.id} appealId={record?.id} files={attachments} change={files => { setAttachments(files); dirty(true); }} />
        <AccusedDetails fir={fir} outcomes={accused} change={rows => { setAccused(rows); dirty(true); }} />
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button type="submit" className={primaryStyle}><Save size={16} />{saving ? "Saving…" : "Save IIF-VII"}</button>
      </fieldset>
    </form>
  );
}

export function IifViiWorkspace() {
  const [panel, setPanel] = useState<"form" | "register">("form");
  const [firs, setFirs] = useState<AppealableFir[]>([]);
  const [register, setRegister] = useState<AppealRegisterRow[]>([]);
  const [details, setDetails] = useState<Details | null>(null);
  const [appeal, setAppeal] = useState<Appeal>();
  const [editorKey, setEditorKey] = useState(0);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const load = panel === "register"
      ? request<{ register: AppealRegisterRow[] }>(endpoint + "?register=1", options).then(result => setRegister(result.register))
      : request<{ firs: AppealableFir[] }>(endpoint, options).then(result => setFirs(result.firs));
    load.catch(error => { if (!controller.signal.aborted) setError(message(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [panel, reload]);

  useEffect(() => {
    if (!dirty) return;
    const handle = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", handle);
    return () => window.removeEventListener("beforeunload", handle);
  }, [dirty]);

  function switchPanel(next: "form" | "register") {
    if (next === panel || (dirty && !window.confirm("Discard unsaved changes and switch panels?"))) return;
    setDirty(false);
    setNotice("");
    setError("");
    setLoading(true);
    setPanel(next);
  }

  async function open(firId: string, appealId?: string) {
    if (dirty && !window.confirm("Discard unsaved changes and open another appeal?")) return;
    setOpening(true);
    setError("");
    setNotice("");
    try {
      const result = await request<Details>(`${endpoint}?${new URLSearchParams({ firId })}`);
      const record = result.appeals.find(item => item.id === appealId);
      if (appealId && !record) throw new Error("Appeal not found.");
      setDetails(result);
      setAppeal(record);
      setEditorKey(key => key + 1);
      setDirty(false);
      if (panel !== "form") { setLoading(true); setPanel("form"); }
    } catch (error) {
      setError(message(error));
    } finally {
      setOpening(false);
    }
  }

  function selectSaved(next?: Appeal) {
    if (dirty && !window.confirm("Discard unsaved changes and switch appeals?")) return;
    setAppeal(next);
    setEditorKey(key => key + 1);
    setDirty(false);
    setNotice("");
  }

  const text = query.trim().toLowerCase();
  function matches(row: AppealableFir, extra: string[] = []) {
    return [row.number, row.caseNo, row.station, row.district, ...extra].some(value => value.toLowerCase().includes(text))
      && (!from || row.date >= from) && (!to || row.date <= to);
  }

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 text-slate-900 sm:p-6 lg:p-8">
      <header className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <ClipboardList size={36} className="rounded-md bg-[#203c88] p-2 text-white" />
        <h1 className="text-2xl font-bold text-[#203c88]">IIF-VII</h1>
      </header>
      <nav aria-label="IIF-VII panels" className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button type="button" aria-pressed={panel === "form"} disabled={opening || saving}
          className={panel === "form" ? primaryStyle : buttonStyle} onClick={() => switchPanel("form")}><FileCheck2 size={16} className="mr-1 inline" />IIF-VII</button>
        <button type="button" aria-pressed={panel === "register"} disabled={opening || saving}
          className={panel === "register" ? primaryStyle : buttonStyle} onClick={() => switchPanel("register")}><ListFilter size={16} className="mr-1 inline" />Register</button>
      </nav>
      <Section title={panel === "register" ? "Court Appeal Register" : "Find FIR"}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-48 flex-1 space-y-1 text-sm font-medium">
            <span className="flex items-center gap-2"><Search size={15} />{panel === "register" ? "Search register" : "Search FIR"}</span>
            <input className={inputStyle} value={query} onChange={event => setQuery(event.target.value)}
              placeholder={panel === "register" ? "FIR, appeal number, or court" : "FIR number, court case number, or police station"} />
          </label>
          <label className="space-y-1 text-sm font-medium">FIR Date From<input className={inputStyle} type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
          <label className="space-y-1 text-sm font-medium">FIR Date To<input className={inputStyle} type="date" min={from || undefined} value={to} onChange={event => setTo(event.target.value)} /></label>
          <button type="button" className={buttonStyle} onClick={() => { setQuery(""); setFrom(""); setTo(""); }}>Clear filters</button>
        </div>
        {loading ? <p role="status" className="text-sm text-slate-600">Loading…</p> : panel === "register" ? (
          <DataTable columns={["FIR No.", "Police Station", "Court Case No.", "Court Name", "Appeal No.", "Appeal Date", "Appeal Type", "Outcome", "Updated", "Updated By", "Action"]}
            empty="No saved appeal forms match the filters."
            rows={register.filter(row => matches(row, [row.appealNo, row.court, row.appealType, ...row.outcomes])).map(row => [
              row.number, row.station, row.caseNo, row.court, row.appealNo, displayDate(row.appealDate), row.appealType,
              row.outcomes.join(", "), displayDate(row.updatedAt), row.updatedBy,
              <button key="open" type="button" className={buttonStyle} disabled={opening} onClick={() => void open(row.id, row.appealId)}>Open</button>,
            ])} />
        ) : (
          <DataTable columns={["S.No.", "FIR No.", "Court Case No.", "Registration Date", "Case Type", "Police Station", "Action"]}
            empty="No FIRs match the filters."
            rows={firs.filter(row => matches(row)).map((row, index) => [
              index + 1, row.number, row.caseNo, displayDate(row.date), row.caseType, row.station,
              <button key="open" type="button" className={buttonStyle} disabled={opening || saving} onClick={() => void open(row.id)}>Open FIR</button>,
            ])} />
        )}
      </Section>
      {error && <div role="alert" className="flex items-center gap-3 rounded-md bg-red-50 p-3 text-sm text-red-800">
        {error}<button type="button" className={buttonStyle} onClick={() => { setError(""); setLoading(true); setReload(value => value + 1); }}>Reload list</button>
      </div>}
      {opening && <p role="status" className="text-sm">Opening FIR…</p>}
      {notice && <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
      {panel === "form" && details && (
        <fieldset disabled={opening || saving} className="space-y-4">
          <label className="block max-w-xl space-y-1 text-sm font-medium">Appeal for {details.fir.number}
            <select className={inputStyle} value={appeal?.id || ""} onChange={event => selectSaved(details.appeals.find(row => row.id === event.target.value))}>
              <option value="">New appeal</option>
              {details.appeals.map(row => <option key={row.id} value={row.id}>{row.values["Appeal No."]} · {displayDate(row.values["Appeal Date"])}</option>)}
            </select>
          </label>
          <AppealEditor key={editorKey} fir={details.fir} initial={appeal} dirty={setDirty} busy={setSaving} saved={next => {
            setAppeal(next);
            setDetails(current => current && { ...current, appeals: [...current.appeals.filter(item => item.id !== next.id), next] });
            setNotice(`Appeal ${next.values["Appeal No."]} saved for ${details.fir.number}.`);
          }} />
        </fieldset>
      )}
    </main>
  );
}
