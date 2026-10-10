import { NextRequest, NextResponse } from "next/server";
import { Prisma, GDRecord } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  formatGDDateDisplay,
  formatGDTimeDisplay24,
  formatGDTimeDisplay12,
  formatGDDateKey,
  formatGDActivityDateTime,
  startOfDay,
} from "@/lib/gdDateTime";
import {
  GeneralDiaryRecord,
  GDOfficerParticulars,
  GDRelatedRecords,
  GDAuditLog,
  GDEntryCategory,
  GDStatus,
  GDSource,
} from "@/types/generalDiary";
import {
  getSmartVerifiedSuggestions,
  dismissSuggestionId,
} from "@/services/gdSmartSuggestionService";

// ------------------------------------------------------------------
// CCTNS-style General Diary backend (Roznamcha, Register No. II)
// - GD numbers are assigned SERVER-side: first entry of the day = 1,
//   strictly sequential, unique per event per day.
// - Date & time are captured from the SERVER clock and are NOT editable.
// - Every entry is persisted in SQLite (searchable forever).
// ------------------------------------------------------------------

const DEFAULT_STATION = "PS City Thanesar";
const DEFAULT_DISTRICT = "Kurukshetra";

function generateAuditId(prefix: string = "AUD"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let hash = "";
  for (let i = 0; i < 8; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${new Date().getFullYear()}-${hash}`;
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

type OfficerPartials = Partial<GDOfficerParticulars>;

function mapRowToRecord(row: GDRecord): GeneralDiaryRecord {
  const related = parseJson<GDRelatedRecords>(row.relatedRecordsJson, {});
  return {
    id: row.id,
    gdNumber: row.gdNumber,
    sequencePerDay: row.sequencePerDay,
    policeStation: row.policeStation,
    district: row.district,
    entryForOfficer: parseJson<GDOfficerParticulars>(row.entryForOfficerJson, {
      name: "Police Officer",
      rank: "Officer",
      beltNumber: "Station Staff",
      pno: "00000000",
    }),
    actualAuthor: parseJson<GDOfficerParticulars>(row.actualAuthorJson, {
      name: "HC Devinder Kumar",
      rank: "Head Constable (MHC)",
      beltNumber: "889/KKR",
      pno: "05192834",
    }),
    typeCode: row.typeCode,
    category: row.category as GDEntryCategory,
    typeDisplay: row.typeDisplay,
    typeDisplayHi: row.typeDisplayHi,
    subject: row.subject,
    narrative: row.narrative,
    // Server-standard CCTNS display: dd/mm/yyyy HH:mm (24-hour)
    activityDateTime: formatGDActivityDateTime(new Date(row.entryDateTime)),
    officialCreationTimestamp: new Date(row.createdAt).toISOString(),
    verificationTimestamp: row.verificationTimestamp
      ? new Date(row.verificationTimestamp).toISOString()
      : undefined,
    status: row.status as GDStatus,
    source: row.source as GDSource,
    isLocked: row.isLocked,
    verificationAuditId: row.verificationAuditId ?? undefined,
    verifiedBy: parseJson<GDOfficerParticulars | null>(row.verifiedByJson, null) ?? undefined,
    relatedRecords: related,
    attachments: related.attachments || [],
    auditTrail: parseJson<GDAuditLog[]>(row.auditTrailJson, []),
    // Internal sort keys — the register is ordered by GD NUMBER, never by
    // creation time (an old draft added later must take its new sequence slot)
    _sortGdDate: formatGDDateKey(new Date(row.gdDate)),
    _sortEntryMs: new Date(row.entryDateTime).getTime(),
  };
}

function buildOfficer(raw: unknown, fallback: GDOfficerParticulars): GDOfficerParticulars {
  const o = (raw || {}) as OfficerPartials;
  return {
    name: o.name || fallback.name,
    rank: o.rank || fallback.rank,
    beltNumber: o.beltNumber || fallback.beltNumber,
    pno: o.pno || fallback.pno,
    phone: o.phone,
    role: o.role,
  };
}

const FALLBACK_OFFICER: GDOfficerParticulars = {
  name: "SI Malkeet",
  rank: "Sub-Inspector",
  beltNumber: "512/KKR",
  pno: "08192841",
};

const FALLBACK_AUTHOR: GDOfficerParticulars = {
  name: "HC Devinder Kumar",
  rank: "Head Constable (MHC)",
  beltNumber: "889/KKR",
  pno: "05192834",
};

async function getNextLockedSequence(gdDate: Date): Promise<{ sequence: number; gdNumber: string }> {
  const count = await prisma.gDRecord.count({
    where: { isLocked: true, gdDate },
  });
  const sequence = count + 1;
  const padded = String(sequence).padStart(3, "0");
  return { sequence, gdNumber: `GD-${formatGDDateKey(gdDate)}-${padded}` };
}

// Renumber every LOCKED entry of one GD day in strict chronological order.
// Used when an entry is inserted BETWEEN existing ones (back-dated filing):
// all later entries automatically shift to the next GD number.
// Two phases (temp numbers first) so the global unique gdNumber constraint
// can never collide mid-reshuffle. Returns how many rows moved.
async function resequenceDay(gdDate: Date): Promise<number> {
  const key = formatGDDateKey(gdDate);
  const rows = await prisma.gDRecord.findMany({
    where: { isLocked: true, gdDate },
    orderBy: [{ entryDateTime: "asc" }, { id: "asc" }],
  });

  let changes = 0;
  rows.forEach((row, i) => {
    const seq = i + 1;
    const gdNumber = `GD-${key}-${String(seq).padStart(3, "0")}`;
    if (row.sequencePerDay !== seq || row.gdNumber !== gdNumber) changes++;
  });
  if (changes === 0) return 0;

  const stamp = Date.now().toString(36).slice(-6);
  // Phase 1 — park every gdNumber on a temp unique value
  for (let i = 0; i < rows.length; i++) {
    await prisma.gDRecord.update({
      where: { id: rows[i].id },
      data: { gdNumber: `GD-${key}-T${stamp}-${i}` },
    });
  }
  // Phase 2 — assign final chronological numbers
  for (let i = 0; i < rows.length; i++) {
    const seq = i + 1;
    await prisma.gDRecord.update({
      where: { id: rows[i].id },
      data: {
        sequencePerDay: seq,
        gdNumber: `GD-${key}-${String(seq).padStart(3, "0")}`,
      },
    });
  }
  return changes;
}

// Resolve the officer-selected activity date/time (back-dating allowed).
// Falls back to the server clock when the form sends nothing.
function resolveEntryDateTime(body: Record<string, unknown>): Date {
  const dateStr = String(body.activityDate || "").trim();
  const timeStr = String(body.activityTime || "").trim();
  const now = new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) && /^\d{2}:\d{2}$/.test(timeStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
    // Guard: an entry can never be stamped in the future
    if (dt.getTime() > now.getTime() + 5 * 60 * 1000) {
      throw new Error(
        "GD entry date/time cannot be in the future. Please pick the actual date & time of the activity."
      );
    }
    return dt;
  }
  return now;
}

// Creates a permanently locked register entry. The activity date/time may be
// back-dated by the officer; the GD number is computed by chronological
// position and later entries of the same day are renumbered automatically.
async function createLockedEntry(
  body: Record<string, unknown>
): Promise<{ record: GeneralDiaryRecord; resequenced: number }> {
  const now = new Date();
  const entryDateTime = resolveEntryDateTime(body);
  const gdDate = startOfDay(entryDateTime);
  const typeCode = String(body.typeCode || "OTHERS");
  const subject = String(body.subject || "").trim();
  if (!subject) throw new Error("Subject is required for a General Diary entry.");
  const narrative = String(body.narrative || "");
  const entryForOfficer = buildOfficer(body.entryForOfficer, FALLBACK_OFFICER);
  const actualAuthor = buildOfficer(body.actualAuthor, FALLBACK_AUTHOR);
  const relatedRecords = (body.relatedRecords || {}) as GDRelatedRecords;
  if (Array.isArray(body.attachments)) {
    relatedRecords.attachments = body.attachments as any;
  }
  const source = String(body.source || "MANUAL_ENTRY");
  const typeDisplay = String(body.typeDisplay || typeCode);
  const typeDisplayHi = String(body.typeDisplayHi || typeDisplay);
  const category = String(body.category || "ROUTINE_ADMINISTRATION");
  const policeStation = String(body.policeStation || DEFAULT_STATION);
  const district = String(body.district || DEFAULT_DISTRICT);

  const auditTrail: GDAuditLog[] = [
    {
      action: "CREATED",
      performedBy: actualAuthor.name,
      performedByPno: actualAuthor.pno,
      performedByRank: actualAuthor.rank,
      timestamp: now.toISOString(),
      auditId: generateAuditId("NEW"),
      remarks: "Entry recorded via Smart GD form",
    },
    {
      action: "VERIFIED",
      performedBy: actualAuthor.name,
      performedByPno: actualAuthor.pno,
      performedByRank: actualAuthor.rank,
      timestamp: now.toISOString(),
      auditId: generateAuditId("VER"),
      remarks: "Officer confirmed factual authenticity",
    },
  ];

  // Server-owned timestamp + atomic per-day numbering (with race retry)
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { sequence, gdNumber } = await getNextLockedSequence(gdDate);
    const auditId = generateAuditId("V-LOCK");
    const trail: GDAuditLog[] = [
      ...auditTrail,
      {
        action: "LOCKED",
        performedBy: actualAuthor.name,
        performedByPno: actualAuthor.pno,
        performedByRank: actualAuthor.rank,
        timestamp: now.toISOString(),
        auditId,
        remarks: `Permanently locked as ${gdNumber} under PPR 22.48`,
      },
    ];
    try {
      const row = await prisma.gDRecord.create({
        data: {
          gdNumber,
          sequencePerDay: sequence,
          gdDate,
          entryDateTime, // officer-picked activity time (defaults to server clock)
          policeStation,
          district,
          typeCode,
          category,
          typeDisplay,
          typeDisplayHi,
          subject,
          narrative,
          entryForOfficerJson: JSON.stringify(entryForOfficer),
          actualAuthorJson: JSON.stringify(actualAuthor),
          status: "LOCKED",
          source,
          isLocked: true,
          isDraft: false,
          relatedRecordsJson: JSON.stringify(relatedRecords),
          auditTrailJson: JSON.stringify(trail),
          verificationAuditId: auditId,
          verifiedByJson: JSON.stringify(actualAuthor),
          verificationTimestamp: now,
        },
      });
      // Inserted between existing entries? Renumber the whole day so every
      // later entry shifts to its correct chronological GD number.
      const resequenced = await resequenceDay(gdDate);
      // Re-fetch: resequencing may have changed this row's final GD number
      const fresh = await prisma.gDRecord.findUnique({ where: { id: row.id } });
      return { record: mapRowToRecord(fresh ?? row), resequenced };
    } catch (err) {
      lastError = err;
      // P2002 = unique constraint collision -> another entry took the number; retry
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue;
      }
      throw err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Could not assign a unique GD number after multiple attempts.");
}

async function saveDraftEntry(body: Record<string, unknown>): Promise<GeneralDiaryRecord> {
  const now = new Date();
  const typeCode = String(body.typeCode || "OTHERS");
  const subject = String(body.subject || "").trim();
  if (!subject) throw new Error("Please enter at least a Subject to save a draft.");
  const narrative = String(body.narrative || "");
  const entryForOfficer = buildOfficer(body.entryForOfficer, FALLBACK_OFFICER);
  const actualAuthor = buildOfficer(body.actualAuthor, FALLBACK_AUTHOR);
  const existingId = body.id ? String(body.id) : undefined;

  // Officer-assigned activity date/time (back-dating allowed) — stored on the
  // draft so "Add to GD" later files it at exactly that moment.
  const hasActivity = /^\d{4}-\d{2}-\d{2}$/.test(String(body.activityDate || "").trim());
  const entryDateTime = hasActivity ? resolveEntryDateTime(body) : now;
  const draftGdDate = startOfDay(entryDateTime);

  if (existingId) {
    const existing = await prisma.gDRecord.findUnique({ where: { id: existingId } });
    if (existing) {
      if (existing.isLocked) {
        throw new Error("Security Error: Locked GD entry cannot be edited under PPR 22.48.");
      }
      const trail = parseJson<GDAuditLog[]>(existing.auditTrailJson, []);
      trail.push({
        action: "EDITED",
        performedBy: actualAuthor.name,
        performedByPno: actualAuthor.pno,
        performedByRank: actualAuthor.rank,
        timestamp: now.toISOString(),
        auditId: generateAuditId("EDIT"),
        remarks: "Draft updated by officer",
      });
      const draftRel = parseJson<GDRelatedRecords>(existing.relatedRecordsJson, {});
      if (Array.isArray(body.attachments)) {
        draftRel.attachments = body.attachments as any;
      }
      const updated = await prisma.gDRecord.update({
        where: { id: existing.id },
        data: {
          typeCode,
          typeDisplay: String(body.typeDisplay || existing.typeDisplay),
          typeDisplayHi: String(body.typeDisplayHi || existing.typeDisplayHi),
          category: String(body.category || existing.category),
          subject,
          narrative,
          entryForOfficerJson: JSON.stringify(entryForOfficer),
          actualAuthorJson: JSON.stringify(actualAuthor),
          relatedRecordsJson: JSON.stringify(draftRel),
          auditTrailJson: JSON.stringify(trail),
          ...(hasActivity ? { entryDateTime, gdDate: draftGdDate } : {}),
        },
      });
      return mapRowToRecord(updated);
    }
  }

  const newDraftRel = ((body.relatedRecords || {}) as GDRelatedRecords);
  if (Array.isArray(body.attachments)) {
    newDraftRel.attachments = body.attachments as any;
  }

  const row = await prisma.gDRecord.create({
    data: {
      gdNumber: `GD-DRAFT-${Date.now()}`,
      sequencePerDay: 0,
      gdDate: draftGdDate,
      entryDateTime,
      policeStation: String(body.policeStation || DEFAULT_STATION),
      district: String(body.district || DEFAULT_DISTRICT),
      typeCode,
      category: String(body.category || "ROUTINE_ADMINISTRATION"),
      typeDisplay: String(body.typeDisplay || typeCode),
      typeDisplayHi: String(body.typeDisplayHi || typeCode),
      subject,
      narrative,
      entryForOfficerJson: JSON.stringify(entryForOfficer),
      actualAuthorJson: JSON.stringify(actualAuthor),
      status: "DRAFT",
      source: "MANUAL_ENTRY",
      isLocked: false,
      isDraft: true,
      relatedRecordsJson: JSON.stringify(newDraftRel),
      auditTrailJson: JSON.stringify([
        {
          action: "CREATED",
          performedBy: actualAuthor.name,
          performedByPno: actualAuthor.pno,
          performedByRank: actualAuthor.rank,
          timestamp: now.toISOString(),
          auditId: generateAuditId("DRAFT"),
          remarks: "Saved as unofficial draft",
        } as GDAuditLog,
      ]),
    },
  });
  return mapRowToRecord(row);
}

async function deleteDraftEntry(id: string): Promise<boolean> {
  dismissSuggestionId(id);
  const existing = await prisma.gDRecord.findUnique({ where: { id } });
  if (!existing) return true;
  if (existing.isLocked) {
    throw new Error("Violation Error: Locked GD entry cannot be deleted. All entries are permanent under law.");
  }
  await prisma.gDRecord.delete({ where: { id } });
  return true;
}

async function verifyAndLockEntry(
  id: string,
  verifierRaw: unknown,
  remarks?: string
): Promise<{ record: GeneralDiaryRecord; resequenced: number }> {
  const verifier = buildOfficer(verifierRaw, FALLBACK_AUTHOR);
  let existing = await prisma.gDRecord.findUnique({ where: { id } });
  if (!existing) {
    const sugg = getSmartVerifiedSuggestions().find((s) => s.id === id);
    if (sugg) {
      dismissSuggestionId(id);
      return await createLockedEntry({
        typeCode: sugg.typeCode,
        category: sugg.category,
        typeDisplay: sugg.typeDisplay,
        typeDisplayHi: sugg.typeDisplayHi,
        subject: sugg.subject,
        narrative: sugg.narrative,
        entryForOfficer: sugg.entryForOfficer,
        actualAuthor: verifier,
        activityDateTime: sugg.activityDateTime,
        relatedRecords: sugg.relatedRecords,
        source: sugg.source,
      });
    }
    throw new Error("GD entry not found.");
  }
  if (existing.isLocked) {
    throw new Error("Security Violation: This General Diary record is already LOCKED and immutable.");
  }

  const now = new Date();
  // Respect the draft's officer-assigned activity date/time (back-dating
  // supported) — the entry is filed at exactly that moment, and the whole
  // day is resequenced so later GD numbers shift automatically.
  const activity = existing.entryDateTime ? new Date(existing.entryDateTime) : now;
  const gdDate = startOfDay(activity);

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { sequence, gdNumber } = await getNextLockedSequence(gdDate);
    const auditId = generateAuditId("V-LOCK");
    const trail = parseJson<GDAuditLog[]>(existing.auditTrailJson, []);
    trail.push(
      {
        action: "VERIFIED",
        performedBy: verifier.name,
        performedByPno: verifier.pno,
        performedByRank: verifier.rank,
        timestamp: now.toISOString(),
        auditId: generateAuditId("VER"),
        remarks: remarks || "Human verification completed",
      },
      {
        action: "LOCKED",
        performedBy: verifier.name,
        performedByPno: verifier.pno,
        performedByRank: verifier.rank,
        timestamp: now.toISOString(),
        auditId,
        remarks: `Permanently locked as ${gdNumber} under PPR 22.48`,
      }
    );
    try {
      const updated = await prisma.gDRecord.update({
        where: { id: existing.id },
        data: {
          gdNumber,
          sequencePerDay: sequence,
          gdDate,
          entryDateTime: activity, // the officer-assigned activity moment
          status: "LOCKED",
          isLocked: true,
          isDraft: false,
          verificationAuditId: auditId,
          verifiedByJson: JSON.stringify(verifier),
          verificationTimestamp: now,
          auditTrailJson: JSON.stringify(trail),
        },
      });
      // Keep the locked day in strict chronological GD-number order
      const resequenced = await resequenceDay(gdDate);
      // Re-fetch: resequencing may have changed this row's final GD number
      const fresh = await prisma.gDRecord.findUnique({ where: { id: existing.id } });
      return { record: mapRowToRecord(fresh ?? updated), resequenced };
    } catch (err) {
      lastError = err;
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue;
      }
      throw err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Could not assign a unique GD number after multiple attempts.");
}

async function createSystemSuggestion(body: Record<string, unknown>): Promise<GeneralDiaryRecord> {
  const now = new Date();
  const event = (body.event || body) as Record<string, unknown>;
  const officer = buildOfficer(event.officer, FALLBACK_OFFICER);
  const typeCodeMap: Record<string, string> = {
    COMPLAINT_REGISTERED: "CITIZEN_INFORMATION_TIP_RECEIVED",
    FIR_LODGED: "CRIMINAL_CASE",
    OFFICER_DISPATCHED: "DEPARTURE",
    MALKHANA_SEIZURE: "PROPERTY_SEIZURE",
  };
  const eventType = String(event.eventType || "");
  const typeCode = typeCodeMap[eventType] || "OTHERS";

  const row = await prisma.gDRecord.create({
    data: {
      gdNumber: `GD-SUGG-${Date.now()}`,
      sequencePerDay: 0,
      gdDate: startOfDay(now),
      entryDateTime: now,
      policeStation: String(event.policeStation || DEFAULT_STATION),
      district: String(event.district || DEFAULT_DISTRICT),
      typeCode,
      category: "ROUTINE_ADMINISTRATION",
      typeDisplay: typeCode,
      typeDisplayHi: typeCode,
      subject: String(event.subject || "System Suggested Entry"),
      narrative: String(event.narrative || ""),
      entryForOfficerJson: JSON.stringify(officer),
      actualAuthorJson: JSON.stringify({
        name: "System Automation",
        rank: "Event Service",
        beltNumber: "SYS/AUTO",
        pno: "00000000",
      }),
      status: "SUGGESTED",
      source: "SYSTEM_EVENT",
      isLocked: false,
      isDraft: false,
      relatedRecordsJson: JSON.stringify((event.relatedRecords || {}) as GDRelatedRecords),
      auditTrailJson: JSON.stringify([
        {
          action: "SUGGESTED",
          performedBy: "CMS Event Engine",
          performedByPno: "SYS/AUTO",
          performedByRank: "Automated Integration",
          timestamp: now.toISOString(),
          auditId: generateAuditId("SYS"),
          remarks: `Auto-suggested from ${eventType || "system event"}`,
        } as GDAuditLog,
      ]),
    },
  });
  return mapRowToRecord(row);
}

// ------------------------------------------------------------------
// GET — search / serverNow / byId
// ------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "SEARCH";

    // Server clock + next GD number (for the read-only new-entry form)
    if (action === "SERVER_NOW") {
      const now = new Date();
      const gdDate = startOfDay(now);
      const count = await prisma.gDRecord.count({ where: { isLocked: true, gdDate } });
      const sequence = count + 1;
      return NextResponse.json({
        success: true,
        data: {
          serverDateDisplay: formatGDDateDisplay(now),
          serverTimeDisplay: formatGDTimeDisplay24(now),
          serverTime12: formatGDTimeDisplay12(now),
          serverDateISO: formatGDDateKey(now),
          nextSequence: sequence,
          nextGdNumber: `GD-${formatGDDateKey(now)}-${String(sequence).padStart(3, "0")}`,
        },
      });
    }

    // Single record by id or GD number (draft edit flow / direct lookup)
    if (action === "BY_ID") {
      const id = searchParams.get("id") || "";
      let row = id ? await prisma.gDRecord.findUnique({ where: { id } }) : null;
      if (!row && id) {
        row = await prisma.gDRecord.findFirst({ where: { gdNumber: id } });
      }
      if (!row && id) {
        const sugg = getSmartVerifiedSuggestions().find((s) => s.id === id);
        if (sugg) {
          return NextResponse.json({ success: true, record: sugg });
        }
      }
      return NextResponse.json({ success: true, record: row ? mapRowToRecord(row) : null });
    }

    // ---- Search / paginated register ----
    const filter = {
      gdNumber: (searchParams.get("gdNumber") || "").trim(),
      startDate: searchParams.get("startDate") || "",
      endDate: searchParams.get("endDate") || "",
      officerQuery: (searchParams.get("officer") || "").trim(),
      personName: (searchParams.get("person") || "").trim(),
      firNumber: (searchParams.get("fir") || "").trim(),
      complaintNumber: (searchParams.get("complaint") || "").trim(),
      vehicleNumber: (searchParams.get("vehicle") || "").trim(),
      typeCode: searchParams.get("type") || "",
      status: searchParams.get("status") || "",
      isLocked: searchParams.get("isLocked"),
      keyword: (searchParams.get("q") || "").trim(),
    };
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "15") || 15);

    // Fetch ALL rows once — status counts are GLOBAL, so tab badges
    // (e.g. the Register count) never change with the active tab.
    const rows = await prisma.gDRecord.findMany({
      orderBy: [{ entryDateTime: "desc" }, { sequencePerDay: "desc" }],
      take: 5000,
    });

    let list = rows.map(mapRowToRecord);

    // Merge verified smart suggestions from live system state
    const verifiedSuggestions = getSmartVerifiedSuggestions();
    const existingIds = new Set(list.map((r) => r.id));
    for (const sugg of verifiedSuggestions) {
      if (!existingIds.has(sugg.id)) {
        list.push(sugg);
      }
    }

    const todayKey = formatGDDateKey(new Date());
    const counts = {
      todayCount: list.filter((r) => r.isLocked && r._sortGdDate === todayKey).length,
      lockedCount: list.filter((r) => r.status === "LOCKED").length,
      verifiedCount: list.filter((r) => r.status === "VERIFIED").length,
      draftCount: list.filter((r) => r.status === "DRAFT").length,
      suggestedCount: list.filter((r) => r.status === "SUGGESTED").length,
    };

    // Tab scope filters (in-memory; register scale is small)
    if (filter.typeCode && filter.typeCode !== "ALL") {
      list = list.filter((r) => r.typeCode === filter.typeCode);
    }
    if (filter.status && filter.status !== "ALL") {
      // Support comma-separated statuses (e.g. "SUGGESTED,DRAFT" tab view)
      const statuses = filter.status
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (statuses.length > 0) {
        list = list.filter((r) => statuses.includes(r.status));
      }
    }
    if (filter.isLocked !== null && filter.isLocked !== undefined && filter.isLocked !== "") {
      const wantLocked = filter.isLocked === "true";
      list = list.filter((r) => r.isLocked === wantLocked);
    }
    // Date range — yyyy-mm-dd keys compare lexicographically
    if (filter.startDate) {
      list = list.filter((r) => (r._sortGdDate || "") >= filter.startDate);
    }
    if (filter.endDate) {
      list = list.filter((r) => (r._sortGdDate || "") <= filter.endDate);
    }

    // JS-level fine filters (case-insensitive across Hindi/English)
    if (filter.gdNumber) {
      const q = filter.gdNumber.toLowerCase();
      list = list.filter((r) => r.gdNumber.toLowerCase().includes(q));
    }
    const officerQuery = filter.officerQuery;
    if (officerQuery) {
      const q = officerQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.entryForOfficer.name.toLowerCase().includes(q) ||
          r.entryForOfficer.beltNumber.toLowerCase().includes(q) ||
          r.entryForOfficer.pno.toLowerCase().includes(q) ||
          r.actualAuthor.name.toLowerCase().includes(q) ||
          r.actualAuthor.pno.toLowerCase().includes(q)
      );
    }
    if (filter.personName) {
      const q = filter.personName.toLowerCase();
      list = list.filter((r) => (r.relatedRecords?.personName || "").toLowerCase().includes(q));
    }
    if (filter.firNumber) {
      const q = filter.firNumber.toLowerCase();
      list = list.filter((r) => (r.relatedRecords?.firNumber || "").toLowerCase().includes(q));
    }
    if (filter.complaintNumber) {
      const q = filter.complaintNumber.toLowerCase();
      list = list.filter((r) => (r.relatedRecords?.complaintNumber || "").toLowerCase().includes(q));
    }
    if (filter.vehicleNumber) {
      const q = filter.vehicleNumber.toLowerCase();
      list = list.filter((r) => (r.relatedRecords?.vehicleNumber || "").toLowerCase().includes(q));
    }
    if (filter.keyword) {
      const q = filter.keyword.toLowerCase();
      list = list.filter(
        (r) =>
          r.subject.toLowerCase().includes(q) ||
          r.narrative.toLowerCase().includes(q) ||
          r.gdNumber.toLowerCase().includes(q) ||
          r.typeDisplay.toLowerCase().includes(q) ||
          r.typeDisplayHi.includes(q) ||
          r.entryForOfficer.name.toLowerCase().includes(q) ||
          r.actualAuthor.name.toLowerCase().includes(q) ||
          (r.relatedRecords?.firNumber || "").toLowerCase().includes(q) ||
          (r.relatedRecords?.complaintNumber || "").toLowerCase().includes(q)
      );
    }

    // Pending suggestions & drafts first (newest first);
    // LOCKED register entries are ALWAYS in immutable GD-number order —
    // never reordered by creation time.
    list.sort((a, b) => {
      if (a.status === "SUGGESTED" && b.status !== "SUGGESTED") return -1;
      if (b.status === "SUGGESTED" && a.status !== "SUGGESTED") return 1;
      if (a.status === "DRAFT" && b.status !== "DRAFT") return -1;
      if (b.status === "DRAFT" && a.status !== "DRAFT") return 1;
      if (a.status !== "LOCKED" && b.status !== "LOCKED") {
        return (b._sortEntryMs || 0) - (a._sortEntryMs || 0);
      }
      const dayComp = (b._sortGdDate || "").localeCompare(a._sortGdDate || "");
      if (dayComp !== 0) return dayComp;
      return b.sequencePerDay - a.sequencePerDay;
    });

    const total = list.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;

    return NextResponse.json({
      success: true,
      data: {
        records: list.slice(startIndex, startIndex + pageSize),
        total,
        page,
        pageSize,
        totalPages,
        ...counts,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch General Diary entries" },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------------
// POST — create locked entry / drafts / verify / suggestions
// ------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = String(body.action || "CREATE_LOCKED");

    if (action === "SYSTEM_EVENT_SUGGESTION") {
      const suggestion = await createSystemSuggestion(body);
      return NextResponse.json({ success: true, suggestion });
    }

    if (action === "VERIFY_AND_LOCK") {
      const locked = await verifyAndLockEntry(
        String(body.id || ""),
        body.verifier,
        body.remarks ? String(body.remarks) : undefined
      );
      return NextResponse.json({ success: true, record: locked.record });
    }

    if (action === "DELETE_DRAFT") {
      const ok = await deleteDraftEntry(String(body.id || ""));
      return NextResponse.json({ success: ok });
    }

    if (action === "DELETE_ATTACHMENT") {
      const id = String(body.id || "");
      const attachmentId = String(body.attachmentId || "");
      if (!id || !attachmentId) {
        return NextResponse.json(
          { success: false, error: "Record ID and Attachment ID are required." },
          { status: 400 }
        );
      }
      const existing = await prisma.gDRecord.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, error: "GD Record not found." }, { status: 404 });
      }
      const rel = parseJson<GDRelatedRecords>(existing.relatedRecordsJson, {});
      const list = Array.isArray(rel.attachments) ? rel.attachments : [];
      rel.attachments = list.filter((a) => a.id !== attachmentId);
      const updated = await prisma.gDRecord.update({
        where: { id },
        data: {
          relatedRecordsJson: JSON.stringify(rel),
        },
      });
      return NextResponse.json({ success: true, record: mapRowToRecord(updated) });
    }

    if (action === "SAVE_DRAFT") {
      const draft = await saveDraftEntry(body);
      return NextResponse.json({ success: true, draft });
    }

    // Default: permanent register entry — back-dated date/time supported,
    // later entries of the same day renumber automatically
    const result = await createLockedEntry(body);
    return NextResponse.json({
      success: true,
      record: result.record,
      resequenced: result.resequenced,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process General Diary request" },
      { status: 500 }
    );
  }
}
