import { readRuntimeJson, writeRuntimeJson } from "@/lib/runtimeJsonStore";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { apiAccess } from "@/lib/apiSecurity";
import { isFirVisibleToUser } from "@/lib/firIntegrity";
import {
  appealFields, identityFields, outcomeFields, fileTypes, reportSubtypes, fileFormats, maxFileSize, maxTotalSize,
  type Appeal, type AppealCase, type AppealableFir, type AppealField, type AppealRegisterRow, type Values,
} from "@/lib/iifVii";
import { readFirRecords } from "@/services/firRepository";
import { iifViRecordPath, readIifViRecord } from "@/services/iifViRepository";
import type { FIRItem } from "@/types";
import type { IifViRecord } from "@/lib/iifVi";

export const runtime = "nodejs";

const values = z.record(z.string().max(120), z.string().trim().max(4000));
const attachment = z.object({
  id: z.string().uuid(), name: z.string().trim().min(1).max(240),
  fileType: z.enum(fileTypes), subtype: z.string().trim().min(1).max(150),
  description: z.string().trim().max(100), size: z.number().int().positive().max(maxFileSize),
  data: z.string().max(280_000).regex(/^[A-Za-z0-9+/]+={0,2}$/).optional(),
});
const input = z.object({
  firId: z.string().min(1).max(200), id: z.string().uuid().optional(), revision: z.string().uuid().optional(),
  values, attachments: z.array(attachment).min(1).max(100),
  accused: z.array(z.object({
    personId: z.string().max(200), values, compensation: z.array(values).max(100), acts: z.array(values).max(100),
  })).min(1).max(100),
});

const storePath = (id: string) => path.join(
  process.env.CMS_IIF_VII_STORE_DIR || path.join(process.cwd(), "prisma", "iif-vii"),
  createHash("sha256").update(id).digest("hex") + ".json",
);
const noCache = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status });
const safeAppeal = (appeal: Appeal): Appeal => ({
  ...appeal, attachments: appeal.attachments.map(({ id, name, fileType, subtype, description, size }) => ({ id, name, fileType, subtype, description, size })),
});

async function readAppeals(file: string): Promise<Appeal[]> {
  try {
    return await readRuntimeJson(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function summarize(fir: FIRItem, vi: IifViRecord | null): AppealableFir {
  return {
    id: fir.id, number: fir.firNumber, date: fir.firDate, station: fir.policeStation, district: fir.district,
    caseNo: vi?.assign?.entries[0]?.values["Court Case No."] || "",
    caseType: vi?.final?.entries[0]?.values["Case Type"] || fir.caseType || "",
  };
}

function describe(fir: FIRItem, vi: IifViRecord | null): AppealCase {
  const assignment = vi?.assign?.entries[0]?.values;
  const final = vi?.final?.entries[0]?.values;
  const accused = vi?.final?.entries[0]?.tables["Disposal Details for the Selected Accused"] || [];
  const firAccused = fir.accusedList || [];
  const legacyAccused = accused.filter(row => row["Accused Name"] && !firAccused.some(person => person.name === row["Accused Name"]));
  const challan = fir.challanRecords?.findLast(row => row.submittedToCourt) || fir.challanRecords?.at(-1);
  return {
    ...summarize(fir, vi), court: assignment?.["Court Name"] || challan?.courtName || fir.courtName || "",
    courtType: assignment?.["Court Type"] || "",
    decisionDate: final?.["Judgment Date"] || "", decisionType: final?.["Nature of Disposal For Case"] || "",
    chargeSheet: assignment?.["Charge Sheet No."] || challan?.challanNumber || (fir.finalFormType === "CHARGESHEET" ? fir.finalFormNumber || "" : ""),
    chargeSheetDate: challan?.issuedAt || (fir.finalFormType === "CHARGESHEET" ? fir.finalFormDate || "" : ""),
    accused: [...firAccused.map((person, index) => {
      const details = accused.find(row => row["Accused Name"] === person.name);
      return {
        id: person.id || `legacy-${createHash("sha256").update(JSON.stringify([index, person.name])).digest("hex")}`,
        name: person.name, relativeName: details?.["Relative Name"] || person.relativeName || person.fatherName || "",
        relation: details?.["Relation Type"] || (person.fatherName ? "Father" : ""),
        currentAddress: person.address || details?.Address || "", permanentAddress: "",
      };
    }), ...legacyAccused.map((row, index) => ({
      id: "disposal-" + createHash("sha256").update(JSON.stringify([index, row["Accused Name"]])).digest("hex"),
      name: row["Accused Name"], relativeName: row["Relative Name"] || "", relation: row["Relation Type"] || "",
      currentAddress: row.Address || "", permanentAddress: "",
    }))],
    acts: fir.actsAndSectionsList?.length ? fir.actsAndSectionsList.map(row => ({ Act: row.act, Sections: row.sections }))
      : fir.actsAndSections ? [{ Act: fir.majorAct || "", Sections: fir.actsAndSections }] : [],
  };
}

function validate(fields: AppealField[], raw: Values): Values {
  const result: Values = {};
  for (const field of fields) {
    const value = raw[field.label];
    if (!value) {
      if (field.required) throw new Error(`Enter ${field.label}.`);
      continue;
    }
    if (field.options && !field.custom && !field.options.includes(value)) throw new Error(`Select a valid ${field.label}.`);
    if (field.kind === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) {
      throw new Error(`Enter a valid ${field.label}.`);
    }
    if (field.kind === "number" && !(field.label.endsWith("(₹)") ? /^\d+(\.\d{1,2})?$/ : /^\d+$/).test(value)) {
      throw new Error(`Enter a valid ${field.label}.`);
    }
    result[field.label] = value;
  }
  return result;
}

export async function GET(req: Request) {
  const user = await apiAccess(req);
  if (user instanceof Response) return user;
  const params = new URL(req.url).searchParams;
  try {
    const firs = (await readFirRecords()).filter(fir => isFirVisibleToUser(user, fir));
    if (params.has("firId")) {
      const fir = firs.find(row => row.id === params.get("firId"));
      if (!fir) return fail("FIR not found.", 404);
      const appeals = await readAppeals(storePath(fir.id));
      if (params.has("attachment")) {
        const file = appeals.find(appeal => appeal.id === params.get("appealId"))?.attachments.find(file => file.id === params.get("attachment"));
        if (!file?.data) return fail("Attachment not found.", 404);
        return new Response(Uint8Array.from(Buffer.from(file.data, "base64")), {
          headers: {
            ...noCache, "Content-Type": "application/octet-stream", "X-Content-Type-Options": "nosniff",
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name.toWellFormed()).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16))}`,
          },
        });
      }
      const firCase = describe(fir, await readIifViRecord(iifViRecordPath(fir.id)));
      return Response.json({ fir: firCase, appeals: appeals.map(safeAppeal) }, { headers: noCache });
    }
    if (params.has("register")) {
      const register: AppealRegisterRow[] = [];
      for (const fir of firs) {
        for (const appeal of await readAppeals(storePath(fir.id))) {
          register.push({
            ...summarize(fir, null), caseNo: appeal.values["Court Case No."] || "",
            appealId: appeal.id, appealNo: appeal.values["Appeal No."], appealDate: appeal.values["Appeal Date"],
            appealType: appeal.values["Appeal Type"], court: appeal.values["Court Name"],
            outcomes: [...new Set(appeal.accused.map(row => row.values["Appeal Outcome"]))],
            updatedAt: appeal.updatedAt, updatedBy: appeal.updatedBy,
          });
        }
      }
      register.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return Response.json({ register }, { headers: noCache });
    }
    const cases = [];
    for (const fir of firs) cases.push(summarize(fir, await readIifViRecord(iifViRecordPath(fir.id))));
    return Response.json({ firs: cases }, { headers: noCache });
  } catch (error) {
    console.error("IIF-VII read failed", error);
    return fail("IIF-VII records could not be loaded.", 503);
  }
}

export async function POST(req: Request) {
  const user = await apiAccess(req);
  if (user instanceof Response) return user;
  const limit = 4_000_000;
  if (Number(req.headers.get("content-length")) > limit) return fail("Request is too large.", 413);
  const body = await req.text().catch(() => "");
  if (body.length > limit) return fail("Request is too large.", 413);
  let raw: unknown;
  try { raw = JSON.parse(body); } catch { return fail("Invalid appeal request.", 400); }
  const parsed = input.safeParse(raw);
  if (!parsed.success) return fail("Enter valid appeal details, at least one accused outcome and at least one attachment.", 400);
  const draft = parsed.data;
  try {
    const fir = (await readFirRecords()).find(row => row.id === draft.firId && isFirVisibleToUser(user, row));
    if (!fir) return fail("FIR not found.", 404);
    const firCase = describe(fir, await readIifViRecord(iifViRecordPath(fir.id)));
    const target = storePath(fir.id);
    await fs.mkdir(path.dirname(target), { recursive: true });
    const lock = await fs.open(target + ".lock", "wx").catch(error => {
      if (error.code === "EEXIST") return null;
      throw error;
    });
    if (!lock) return fail("A save is in progress. Please retry.", 409);
    try {
      const records = await readAppeals(target);
      const previous = draft.id ? records.find(row => row.id === draft.id) : undefined;
      if ((draft.id && !previous) || previous?.revision !== draft.revision) return fail("This appeal has changed. Reopen it before saving.", 409);
      const id = previous?.id || randomUUID();
      let appeal: Appeal;
      try {
        const fields = validate([...appealFields, { label: "Court Case No.", required: true }], draft.values);
        if (records.some(row => row.id !== id && row.values["Appeal No."].toLowerCase() === fields["Appeal No."].toLowerCase() &&
          row.values["Court Name"].toLowerCase() === fields["Court Name"].toLowerCase() &&
          row.values["Appeal Date"].slice(0, 4) === fields["Appeal Date"].slice(0, 4))) {
          return fail("This appeal number is already saved for this court and year.", 409);
        }
        if (new Set(draft.accused.map(row => row.personId)).size !== draft.accused.length) throw new Error("An accused can only appear once per appeal.");
        const accused = draft.accused.map(row => {
          if (!firCase.accused.some(person => person.id === row.personId) && !previous?.accused.some(person => person.personId === row.personId)) {
            throw new Error("Select an accused linked to this FIR.");
          }
          const details = validate([...identityFields, ...outcomeFields], row.values);
          return {
            personId: row.personId, values: details,
            compensation: row.compensation.map(item => validate([
              { label: "Payable By", required: true }, { label: "Payable To", required: true }, { label: "Amount (₹)", required: true, kind: "number" },
            ], item)),
            acts: row.acts.map(item => validate([{ label: "Act" }, { label: "Sections", required: true }], item)),
          };
        });
        if (new Set(draft.attachments.map(file => file.id)).size !== draft.attachments.length) throw new Error("Duplicate attachments.");
        if (draft.attachments.reduce((sum, file) => sum + file.size, 0) > maxTotalSize) throw new Error("Attachments exceed 1,024 KB in total.");
        const attachments = draft.attachments.map(file => {
          const data = file.data || previous?.attachments.find(item => item.id === file.id)?.data;
          const bytes = Buffer.from(data || "", "base64");
          if (!fileFormats.includes(file.name.split(".").at(-1)?.toLowerCase() || "") || bytes.length !== file.size || bytes.toString("base64") !== data) {
            throw new Error("Choose a supported attachment up to 200 KB.");
          }
          if (file.fileType === "Report" && !reportSubtypes.includes(file.subtype)) throw new Error("Select a valid report subtype.");
          return { ...file, data };
        });
        appeal = { id, revision: randomUUID(), values: fields, accused, attachments, updatedAt: new Date().toISOString(), updatedBy: user.name };
      } catch (error) {
        return fail((error as Error).message, 400);
      }
      const next = previous ? records.map(item => item.id === id ? appeal : item) : [...records, appeal];
      await writeRuntimeJson(target, next);
      return Response.json({ appeal: safeAppeal(appeal) }, { headers: noCache });
    } finally {
      await lock.close();
      await fs.unlink(target + ".lock");
    }
  } catch (error) {
    console.error("IIF-VII save failed", error);
    return fail("IIF-VII form could not be saved.", 503);
  }
}
