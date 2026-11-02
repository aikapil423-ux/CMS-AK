import { TelecomService, telecomService } from "@/services/telecomService";
import { firService } from "@/services/firService";
import { isFirVisibleToUser } from "@/lib/firIntegrity";
import type { UserSession } from "@/types";
import type { TelecomIntelligenceStore } from "@/types/telecom";

const serviceFirScopes = new WeakMap<TelecomService, Set<string>>();

export async function validateTelecomReferences(service: TelecomService, value: unknown) {
  const store = await service.getStore();
  const files = new Set(store.files.map(f => f.id));
  const records = new Set([...store.callRecords, ...store.ipdrRecords, ...store.towerDumpRecords].map(r => r.id));
  const findings = new Set(store.savedFindings.map(f => f.id));
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    for (const [key, item] of Object.entries(node)) {
      if (["firId", "linkedFirId"].includes(key) && typeof item === "string" && item !== "ALL" && !serviceFirScopes.get(service)?.has(item)) throw new Error("Access denied to referenced FIR");
      const allowed = ["fileId", "evidenceFileIds", "supportingFileIds", "fileIdsIncluded"].includes(key) ? files
        : ["recordId", "supportingRecordIds"].includes(key) ? records
        : ["findingId", "supportingFindingIds"].includes(key) ? findings : undefined;
      if (allowed) for (const id of Array.isArray(item) ? item : [item]) {
        if (typeof id !== "string" || !allowed.has(id)) throw new Error("Access denied to referenced evidence");
      }
      visit(item);
    }
  };
  visit(value);
  const node = value as { firId?: string; evidenceFileIds?: string[]; supportingFileIds?: string[]; evidenceIds?: string[] };
  if (node?.firId) {
    for (const id of [...(node.evidenceFileIds || []), ...(node.supportingFileIds || []), ...(node.evidenceIds || [])]) {
      if (!store.files.some(f => f.id === id && f.linkedFirId === node.firId)) throw new Error("Access denied to evidence from another FIR");
    }
  }
  if (value && typeof value === "object") for (const child of Object.values(value)) {
    if (child && typeof child === "object" && !Array.isArray(child)) await validateTelecomReferences(service, child);
  }
}

/** Per-request view: methods cannot accidentally read a different officer's case. */
export async function telecomAccess(user: UserSession, requestedFir?: string) {
  const firs = firService.getAllFirs().filter(f => isFirVisibleToUser(user, f));
  const allAllowed = new Set(firs.map(f => f.id));
  const allowed = new Set(firs.filter(f => !requestedFir || requestedFir === "ALL" || f.id === requestedFir).map(f => f.id));
  if (requestedFir && requestedFir !== "ALL" && !allAllowed.has(requestedFir)) throw new Error("Access denied to this FIR");
  if (user.role === "SUPER_ADMIN" && (!requestedFir || requestedFir === "ALL")) {
    serviceFirScopes.set(telecomService, allAllowed);
    return { service: telecomService, firs };
  }
  const original = await telecomService.getStore();
  const files = new Set(original.files.filter(f => f.linkedFirId && allowed.has(f.linkedFirId)).map(f => f.id));
  const numbers = new Set(original.callRecords.filter(c => c.firId && allowed.has(c.firId)).flatMap(c => [c.sourceNumber, c.destinationNumber]));
  type Row = { firId?: string; linkedFirId?: string; fileId?: string; phoneNumber?: string; msisdn?: string; cellId?: string };
  const cells = new Set(original.callRecords.filter(c => c.firId && allowed.has(c.firId)).flatMap(c => [c.firstCellId, c.lastCellId]).filter(Boolean));
  const visible = (key: string, row: Row) => {
    if (["knowledgeBase", "methodRegistry", "parsingProfiles"].includes(key)) return true;
    const fir = row.firId || row.linkedFirId;
    if (fir) return allowed.has(fir);
    if (row.fileId) return files.has(row.fileId);
    if (key === "towers") return cells.has(row.cellId);
    if (row.phoneNumber || row.msisdn) return numbers.has(row.phoneNumber || row.msisdn!);
    return false;
  };
  const service = new TelecomService();
  serviceFirScopes.set(service, allowed);
  service.getStore = async () => {
    const store = await telecomService.getStore();
    for (const key of Object.keys(store) as (keyof TelecomIntelligenceStore)[]) {
      (store as unknown as Record<string, unknown>)[key] = store[key].filter(row => visible(key, row as Row));
    }
    return store;
  };
  service.saveStore = async scoped => {
    const full = await telecomService.getStore();
    for (const key of Object.keys(scoped) as (keyof TelecomIntelligenceStore)[]) {
      if (["knowledgeBase", "methodRegistry", "parsingProfiles"].includes(key)) continue;
      if (scoped[key].some(row => !visible(key, row as Row))) throw new Error("Access denied to evidence outside your FIRs");
      (full as unknown as Record<string, unknown>)[key] = [...full[key].filter(row => !visible(key, row as Row)), ...scoped[key]];
    }
    await telecomService.saveStore(full);
  };
  return { service, firs };
}
