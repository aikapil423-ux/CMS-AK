import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { apiAccess } from "@/lib/apiSecurity";
import { isFirVisibleToUser } from "@/lib/firIntegrity";
import { formGroups, iifViStages, requiredField, uploadFields, visibleField, type Entry, type Field, type IifViRecord, type StageRecord, type Values } from "@/lib/iifVi";
import { iifViRecordPath as storePath, readIifViRecord as readRecord } from "@/services/iifViRepository";
import { readFirRecords } from "@/services/firRepository";
import type { FIRItem } from "@/types";

export const runtime = "nodejs";

const valuesSchema = z.record(z.string().max(120), z.string().trim().max(4000));
const attachmentSchema = z.object({
  name: z.string().trim().min(1).max(240),
  data: z.string().max(7_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/).optional(),
});
const inputSchema = z.object({
  firId: z.string().min(1).max(200),
  revision: z.string().uuid().optional(),
  stage: z.enum(iifViStages),
  entries: z.array(z.object({
    values: valuesSchema,
    tables: z.record(z.string().max(120), z.array(valuesSchema).max(100)),
  })).min(1).max(100),
  attachments: z.record(z.string().max(120), attachmentSchema.nullable()),
});

function caseSummary(fir: FIRItem) {
  return {
    id: fir.id, number: fir.firNumber, date: fir.firDate, station: fir.policeStation,
    district: fir.district, year: fir.firYear,
  };
}

function describeCase(fir: FIRItem) {
  const challan = fir.challanRecords?.findLast(row => row.submittedToCourt) || fir.challanRecords?.at(-1);
  return {
    ...caseSummary(fir),
    complainant: fir.complainantName,
    chargeSheetNo: challan?.challanNumber || (fir.finalFormType === "CHARGESHEET" ? fir.finalFormNumber : "") || "",
    chargeSheetDate: challan?.issuedAt || (fir.finalFormType === "CHARGESHEET" ? fir.finalFormDate : "") || "",
    courtName: challan?.courtName || "",
    io: fir.assignedIoName || "",
    accused: (fir.accusedList ?? []).map(person => ({
      name: person.name, relativeName: person.relativeName || person.fatherName || "",
      age: String(person.age ?? ""), alias: person.alias || "", address: person.address || "", phone: person.phone || "",
    })),
    tables: {
      Occurrence: fir.occurrencesList?.length ? fir.occurrencesList.map(row => ({
        "Date Range of Occurrence": [row.dateFrom, row.dateTo].filter(Boolean).join(" – "),
        "Place of Occurrence": row.address || row.area || row.city || "",
        "Distance from P.S.": String(row.distanceFromPsKm ?? row.distanceKm ?? ""),
        "Direction from P.S.": row.directionFromPs || "",
      })) : fir.incidentDateFrom || fir.incidentPlace ? [{
        "Date Range of Occurrence": [fir.incidentDateFrom, fir.incidentDateTo].filter(Boolean).join(" – "),
        "Place of Occurrence": fir.incidentPlace || "", "Distance from P.S.": fir.distanceFromPs || "",
      }] : [],
      "Property Seized": (fir.propertiesList ?? []).map(row => ({
        "Property Seized": row.description || row.natureOfProperty || "",
        "Type of Property": row.propertyType || row.propertyCategory || "",
        "Estimated Value (Seized / Recovered) (in INR)": String(row.estimatedValue ?? ""),
      })),
      "Act & Section": fir.actsAndSectionsList?.length
        ? fir.actsAndSectionsList.map(row => ({ Act: row.act, Section: row.sections }))
        : fir.actsAndSections ? [{ Act: fir.majorAct || "", Section: fir.actsAndSections }] : [],
    },
  };
}

function withoutFileContents(record: IifViRecord | null) {
  if (!record) return null;
  const detail: IifViRecord = { revision: record.revision };
  for (const stage of iifViStages) {
    const saved = record[stage];
    if (saved) detail[stage] = {
      ...saved,
      attachments: Object.fromEntries(Object.entries(saved.attachments).map(([field, { name }]) => [field, { name }])),
    };
  }
  return detail;
}

function validateFields(fields: Field[], raw: Values): Values {
  const values: Values = {};
  for (const field of fields) {
    const value = Object.hasOwn(raw, field.label) ? raw[field.label] : "";
    if (!visibleField(field, raw)) continue;
    if (!value && requiredField(field, raw)) throw new Error(`Enter ${field.label}.`);
    if (!value) continue;
    if (field.options && !field.custom && !field.options.includes(value)) throw new Error(`Choose a valid ${field.label}.`);
    if (field.kind === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) throw new Error(`Enter a valid date for ${field.label}.`);
    if (field.kind === "number" && (!/^\d+(?:\.\d{1,2})?$/.test(value) || (value.includes(".") && !field.label.endsWith("(Rs.)")))) throw new Error(`Enter a valid number for ${field.label}.`);
    values[field.label] = value;
  }
  return values;
}

function validateEntry(stage: z.infer<typeof inputSchema>["stage"], entry: Entry): Entry {
  const values = validateFields(formGroups[stage].filter(group => !group.table).flatMap(group => group.fields), entry.values);
  const tables: Entry["tables"] = {};
  for (const group of formGroups[stage]) {
    if (!group.table || group.source) continue;
    const rows = entry.tables[group.table] || [];
    if ((stage === "final" || group.table === "Accused Trial Details") && !rows.length) {
      throw new Error(`Add at least one row to ${group.title}.`);
    }
    tables[group.table] = rows.map(row => validateFields(group.fields, row));
  }
  return { values, tables };
}

export async function GET(req: Request) {
  const user = await apiAccess(req);
  if (user instanceof Response) return user;
  const params = new URL(req.url).searchParams;
  try {
    const firs = (await readFirRecords()).filter(fir => isFirVisibleToUser(user, fir));
    const firId = params.get("firId");
    if (firId) {
      const fir = firs.find(row => row.id === firId);
      if (!fir) return Response.json({ error: "FIR not found." }, { status: 404 });
      const record = await readRecord(storePath(firId));
      if (params.has("attachment")) {
        const stage = z.enum(iifViStages).safeParse(params.get("stage"));
        const field = params.get("attachment") || "";
        const file = stage.success && uploadFields[stage.data].includes(field) ? record?.[stage.data]?.attachments[field] : null;
        if (!file?.data) return Response.json({ error: "Attachment not found." }, { status: 404 });
        return new Response(Uint8Array.from(Buffer.from(file.data, "base64")), {
          headers: {
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name.toWellFormed()).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16))}`,
            "Content-Type": "application/octet-stream",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-store",
          },
        });
      }
      return Response.json({ fir: describeCase(fir), record: withoutFileContents(record) });
    }

    const register = [];
    if (params.has("register")) {
      for (const fir of firs) {
        const record = await readRecord(storePath(fir.id));
        if (!record) continue;
        const assignment = record.assign?.entries[0]?.values;
        const final = record.final?.entries[0]?.values;
        const latest = [record.assign, record.trial, record.final].filter(item => item !== undefined)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
        register.push({
          ...caseSummary(fir), caseNo: assignment?.["Court Case No."] || "", court: assignment?.["Court Name"] || "",
          hearingCount: record.trial?.entries.length ?? 0, finalSaved: Boolean(final),
          judgmentDate: final?.["Judgment Date"] || "", outcome: final?.["Nature of Disposal For Case"] || "",
          updatedAt: latest?.updatedAt || "", updatedBy: latest?.updatedBy || "",
        });
      }
      register.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return Response.json({ firs: firs.map(caseSummary), register });
  } catch (error) {
    console.error("IIF-VI read failed", error);
    return Response.json({ error: "IIF-VI records could not be loaded." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const user = await apiAccess(req);
  if (user instanceof Response) return user;
  const limit = 23_000_000;
  if (Number(req.headers.get("content-length")) > limit) return Response.json({ error: "Upload is too large." }, { status: 413 });
  const body = await req.text().catch(() => "");
  if (body.length > limit) return Response.json({ error: "Upload is too large." }, { status: 413 });
  let raw: unknown;
  try { raw = JSON.parse(body); } catch { raw = null; }
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Invalid IIF-VI form data." }, { status: 400 });
  const { firId, stage, revision, entries, attachments } = parsed.data;
  if (stage !== "trial" && entries.length !== 1) return Response.json({ error: "This form takes one entry." }, { status: 400 });
  let validated: Entry[];
  try {
    validated = entries.map(entry => validateEntry(stage, entry));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }

  try {
    const fir = (await readFirRecords()).find(row => row.id === firId);
    if (!fir || !isFirVisibleToUser(user, fir)) return Response.json({ error: "FIR not found." }, { status: 404 });
    const file = storePath(firId);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const lock = await fs.open(file + ".lock", "wx").catch(error => {
      if (error.code === "EEXIST") return null;
      throw error;
    });
    if (!lock) return Response.json({ error: "A save is in progress. Please retry." }, { status: 409 });
    const temp = file + "." + randomUUID() + ".tmp";
    try {
      const previous = await readRecord(file);
      if (previous?.revision !== revision) return Response.json({ error: "This FIR was updated. Reload it before saving." }, { status: 409 });
      if (stage !== "assign" && !previous?.assign) return Response.json({ error: "Save the court assignment first." }, { status: 409 });
      const savedAttachments: StageRecord["attachments"] = {};
      for (const field of uploadFields[stage]) {
        const current = attachments[field];
        const saved = current?.data ? current : current === null ? undefined : previous?.[stage]?.attachments[field];
        if (saved?.data) {
          const bytes = Buffer.from(saved.data, "base64");
          if (!bytes.length || bytes.length > 5 * 1024 * 1024 || bytes.toString("base64") !== saved.data) {
            return Response.json({ error: `${field} must be a valid file up to 5 MB.` }, { status: 400 });
          }
          savedAttachments[field] = saved;
        }
      }
      if (stage === "final" && !savedAttachments["Court Disposal Form"]) {
        return Response.json({ error: "Attach the Court Disposal Form." }, { status: 400 });
      }
      const record: IifViRecord = {
        ...previous, revision: randomUUID(),
        [stage]: { entries: validated, attachments: savedAttachments, updatedAt: new Date().toISOString(), updatedBy: user.name },
      };
      await fs.writeFile(temp, JSON.stringify(record), { mode: 0o600 });
      await fs.rename(temp, file);
      return Response.json({ record: withoutFileContents(record) });
    } finally {
      await fs.rm(temp, { force: true });
      await lock.close();
      await fs.unlink(file + ".lock");
    }
  } catch (error) {
    console.error("IIF-VI write failed", error);
    return Response.json({ error: "IIF-VI form could not be saved." }, { status: 503 });
  }
}
