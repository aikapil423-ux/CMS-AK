import { readRuntimeJson, writeRuntimeJson } from "../lib/runtimeJsonStore";
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes, scryptSync, randomUUID } from 'node:crypto';
import type {
  MasterAccount,
  AccountRole,
  JurisdictionType,
  SpecialStationAllocation,
  AccountAuditLog,
} from '../types/adminMaster';
import { INVESTIGATING_OFFICER_LABEL, isRetiredDutyOfficerRole } from "../lib/officerRoles";
import { DEMO_USERS } from '../lib/mockData';
import { readMasterLocationReferences } from './masterLocationReferences';

const STORE_PATH = path.join(process.cwd(), 'prisma', 'accounts-master-store.json');
const AUDIT_STORE_PATH = path.join(process.cwd(), 'prisma', 'accounts-audit-store.json');
const LOCK_PATH = STORE_PATH + '.lock';

interface AccountsStoreData {
  accounts: MasterAccount[];
  updatedAt: string;
}

// Generate secure scrypt password hash matching serverSession.ts format: "salt:hash"
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pin, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// Map Demo users to initial Master Accounts
function getInitialAccounts(): MasterAccount[] {
  const now = new Date().toISOString();
  const defaultHash = hashPin('123456');

  return DEMO_USERS.map((u) => {
    let assignedUnitType: MasterAccount['assignedUnitType'] = 'POLICE_STATION';
    let jurisdictionType: JurisdictionType = 'SINGLE_STATION';
    let roleVal: AccountRole = 'SHO';

    if (u.role === 'SP_DISTRICT') {
      assignedUnitType = 'DISTRICT_OFFICE';
      jurisdictionType = 'DISTRICT_WIDE';
      roleVal = 'SP_DISTRICT';
    } else if (u.role === 'DSP_SUBDIV') {
      assignedUnitType = 'DISTRICT_OFFICE';
      jurisdictionType = 'SUBDIVISION_MULTI_STATION';
      roleVal = 'DSP_SUBDIV';
    } else if (u.role === 'MHC_GD_INCHARGE' || u.role === 'MM') {
      assignedUnitType = 'MHC_STORE';
      jurisdictionType = 'SINGLE_STATION';
      roleVal = u.role;
    } else if (u.role === 'ENQUIRY_OFFICER') {
      assignedUnitType = 'POLICE_STATION';
      jurisdictionType = 'SINGLE_STATION';
      roleVal = 'ENQUIRY_OFFICER';
    }

    return {
      id: u.id,
      username: u.pno,
      pno: u.pno,
      beltNumber: u.beltNumber || u.pno,
      fullName: u.name,
      mobileNumber: `98120${u.id.replace(/\D/g, '').padEnd(5, '0').slice(0, 5)}`,
      email: `${u.pno.toLowerCase().replace(/[^a-z0-9]/g, '')}@hry.police.gov.in`,
      designation: u.rankDisplay || u.rank,
      rank: u.rank,
      rankDisplay: u.rankDisplay,
      role: roleVal,
      roleDisplay: u.roleDisplay,
      assignedUnitType,
      assignedUnitId: u.stationCode,
      assignedUnitName: u.stationName,
      state: 'Haryana',
      range: u.district === 'Karnal' || u.district === 'Panipat' ? 'Karnal Range' : 'Ambala Range',
      district: u.district,
      policeStation: u.stationName,
      authorizedPoliceStations: [u.stationName],
      jurisdictionType,
      status: 'ACTIVE',
      passwordHash: defaultHash,
      plainPinSample: '123456',
      createdAt: now,
      updatedAt: now,
    };
  });
}

// Atomic file locking helper
async function withStoreLock<T>(fn: () => Promise<T>): Promise<T> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  let handle;
  for (let i = 0; i < 120; i++) {
    try {
      handle = await fs.open(LOCK_PATH, 'wx');
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      await new Promise((r) => setTimeout(r, 25));
    }
  }
  if (!handle) throw new Error('Accounts store is busy. Please retry shortly.');
  try {
    return await fn();
  } finally {
    await handle.close();
    await fs.unlink(LOCK_PATH).catch(() => {});
  }
}

function normalizeAccountRole(account: MasterAccount): MasterAccount {
  if (!isRetiredDutyOfficerRole(account.role)) return account;
  return {
    ...account,
    role: 'ENQUIRY_OFFICER',
    designation: INVESTIGATING_OFFICER_LABEL,
    rankDisplay: account.rankDisplay?.replace(/\s*\(Duty Officer[^)]*\)/i, '') || account.rank,
    roleDisplay: INVESTIGATING_OFFICER_LABEL,
  };
}

async function mapAccountLocationReferences(data: AccountsStoreData, direction: 'id' | 'name'): Promise<AccountsStoreData> {
  const locations = await readMasterLocationReferences();
  return {
    ...data,
    accounts: data.accounts.map(account => ({
      ...locations.location(normalizeAccountRole(account), direction),
      state: locations.state(account.state, direction),
      range: locations.range(account.range, direction),
      authorizedDistricts: account.authorizedDistricts?.map(value => locations.district(value, direction)),
      authorizedPoliceStations: account.authorizedPoliceStations?.map(value =>
        locations.station(value, account.district, direction)
      ),
    })),
  };
}

// Read accounts with the location labels expected by the session and UI.
export async function readAccountsStore(): Promise<AccountsStoreData> {
  try {
    const parsed = await readRuntimeJson<AccountsStoreData>(STORE_PATH);
    if (!parsed || !Array.isArray(parsed.accounts)) {
      throw new Error('Invalid account store');
    }
    return await mapAccountLocationReferences(parsed as AccountsStoreData, 'name');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      const initial: AccountsStoreData = {
        accounts: getInitialAccounts(),
        updatedAt: new Date().toISOString(),
      };
      await writeAccountsStore(initial);
      return initial;
    }
    throw e;
  }
}

// Write accounts data atomically
export async function writeAccountsStore(data: AccountsStoreData): Promise<void> {
  await withStoreLock(async () => {
    data.updatedAt = new Date().toISOString();
    await writeRuntimeJson(STORE_PATH, await mapAccountLocationReferences(data, 'id'));
  });
}

// Read Audit Logs
export async function readAccountAuditLogs(): Promise<AccountAuditLog[]> {
  try {
    const parsed = await readRuntimeJson<AccountAuditLog[]>(AUDIT_STORE_PATH);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
}

// Append Audit Log
export async function recordAccountAudit(log: Omit<AccountAuditLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    const logs = await readAccountAuditLogs();
    logs.unshift({
      ...log,
      id: 'aud_' + randomUUID(),
      timestamp: new Date().toISOString(),
    });
    // Keep last 1000 logs
    const trimmed = logs.slice(0, 1000);
    await writeRuntimeJson(AUDIT_STORE_PATH, trimmed);
  } catch (err) {
    console.error('Failed to write account audit log:', err);
  }
}

/* =========================================================================
   PUBLIC ACCOUNT OPERATIONS
   ========================================================================= */

export async function getAllAccounts(): Promise<MasterAccount[]> {
  const store = await readAccountsStore();
  return store.accounts;
}

export async function getAccountByUsername(username: string): Promise<MasterAccount | null> {
  const store = await readAccountsStore();
  const normalized = username.trim().toUpperCase();
  return store.accounts.find((a) => a.username.toUpperCase() === normalized || a.pno.toUpperCase() === normalized) || null;
}

export async function getAccountById(id: string): Promise<MasterAccount | null> {
  const store = await readAccountsStore();
  return store.accounts.find((a) => a.id === id) || null;
}

export interface CreateAccountInput {
  pno: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  beltNumber?: string;
  designation: string;
  rank: string;
  rankDisplay: string;
  role: AccountRole;
  roleDisplay: string;
  assignedUnitType: MasterAccount['assignedUnitType'];
  assignedUnitId: string;
  assignedUnitName: string;
  state: string;
  range: string;
  district: string;
  zone?: string;
  authorizedDistricts?: string[];
  policeStation: string;
  authorizedPoliceStations?: string[];
  jurisdictionType: JurisdictionType;
  pin: string;
  specialAllocations?: SpecialStationAllocation[];
}

export async function createAccount(
  input: CreateAccountInput,
  developerAdminPno = 'DEV-ADMIN',
  developerAdminName = 'Developer Administrator'
): Promise<MasterAccount> {
  const store = await readAccountsStore();
  const normalizedPno = input.pno.trim().toUpperCase();

  const existing = store.accounts.find(
    (a) => a.username.toUpperCase() === normalizedPno || a.pno.toUpperCase() === normalizedPno
  );
  if (existing) {
    throw new Error(`An account with PNO / Username '${input.pno}' already exists.`);
  }

  const existingMobile = store.accounts.find(
    (a) => a.mobileNumber.replace(/\D/g, '') === input.mobileNumber.replace(/\D/g, '')
  );
  if (existingMobile) {
    throw new Error(`An account with Mobile Number '${input.mobileNumber}' already exists.`);
  }

  const now = new Date().toISOString();
  const newAccount = normalizeAccountRole({
    id: 'usr_' + randomUUID().slice(0, 8),
    username: normalizedPno,
    pno: normalizedPno,
    beltNumber: input.beltNumber?.trim() || normalizedPno,
    fullName: input.fullName.trim(),
    mobileNumber: input.mobileNumber.trim(),
    email: input.email?.trim() || `${normalizedPno.toLowerCase()}@hry.police.gov.in`,
    designation: input.designation.trim(),
    rank: input.rank,
    rankDisplay: input.rankDisplay || input.rank,
    role: input.role,
    roleDisplay: input.roleDisplay || input.role,
    assignedUnitType: input.assignedUnitType,
    assignedUnitId: input.assignedUnitId,
    assignedUnitName: input.assignedUnitName,
    state: input.state,
    range: input.range,
    district: input.district,
    zone: input.zone?.trim() || "",
    authorizedDistricts: input.authorizedDistricts || [input.district],
    policeStation: input.policeStation,
    authorizedPoliceStations: input.authorizedPoliceStations || [input.policeStation],
    jurisdictionType: input.jurisdictionType,
    specialAllocations: input.specialAllocations || [],
    status: 'ACTIVE',
    passwordHash: hashPin(input.pin),
    plainPinSample: input.pin, // Available in dev/demo mode
    createdAt: now,
    updatedAt: now,
  });

  store.accounts.unshift(newAccount);
  await writeAccountsStore(store);

  // Audit Log
  await recordAccountAudit({
    action: 'CREATE',
    performedByPno: developerAdminPno,
    performedByName: developerAdminName,
    targetAccountId: newAccount.id,
    targetUsername: newAccount.username,
    details: `Created new ${newAccount.role} account for ${newAccount.fullName} (${newAccount.pno}) posted at ${newAccount.policeStation}, ${newAccount.district}.`,
    newSnapshot: newAccount,
  });

  return newAccount;
}

export async function updateAccount(
  id: string,
  updates: Partial<Omit<MasterAccount, 'id' | 'username' | 'pno' | 'createdAt'>>,
  developerAdminPno = 'DEV-ADMIN',
  developerAdminName = 'Developer Administrator'
): Promise<MasterAccount> {
  const store = await readAccountsStore();
  const idx = store.accounts.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('Account not found.');

  const previous = { ...store.accounts[idx] };
  const updated = normalizeAccountRole({
    ...store.accounts[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  store.accounts[idx] = updated;
  await writeAccountsStore(store);

  // Audit Log
  await recordAccountAudit({
    action: 'UPDATE',
    performedByPno: developerAdminPno,
    performedByName: developerAdminName,
    targetAccountId: id,
    targetUsername: updated.username,
    details: `Updated details for ${updated.fullName} (${updated.pno}). Role: ${updated.role}, Posting: ${updated.policeStation}.`,
    previousSnapshot: previous,
    newSnapshot: updated,
  });

  return updated;
}

export async function toggleAccountStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  developerAdminPno = 'DEV-ADMIN',
  developerAdminName = 'Developer Administrator'
): Promise<MasterAccount> {
  const store = await readAccountsStore();
  const account = store.accounts.find((a) => a.id === id);
  if (!account) throw new Error('Account not found.');

  const prevStatus = account.status;
  account.status = status;
  account.updatedAt = new Date().toISOString();
  await writeAccountsStore(store);

  await recordAccountAudit({
    action: status === 'ACTIVE' ? 'ACTIVATE' : 'DEACTIVATE',
    performedByPno: developerAdminPno,
    performedByName: developerAdminName,
    targetAccountId: id,
    targetUsername: account.username,
    details: `Changed account status from ${prevStatus} to ${status}.`,
  });

  return account;
}

export async function resetAccountPassword(
  id: string,
  newPin: string,
  developerAdminPno = 'DEV-ADMIN',
  developerAdminName = 'Developer Administrator'
): Promise<boolean> {
  const store = await readAccountsStore();
  const account = store.accounts.find((a) => a.id === id);
  if (!account) throw new Error('Account not found.');

  account.passwordHash = hashPin(newPin);
  account.plainPinSample = newPin;
  account.updatedAt = new Date().toISOString();
  await writeAccountsStore(store);

  await recordAccountAudit({
    action: 'RESET_PASSWORD',
    performedByPno: developerAdminPno,
    performedByName: developerAdminName,
    targetAccountId: id,
    targetUsername: account.username,
    details: `Password / PIN was reset by Developer Administrator.`,
  });

  return true;
}

export async function deleteAccount(
  id: string,
  developerAdminPno = 'DEV-ADMIN',
  developerAdminName = 'Developer Administrator'
): Promise<boolean> {
  const store = await readAccountsStore();
  const index = store.accounts.findIndex((a) => a.id === id);
  if (index === -1) throw new Error('Account not found.');

  const account = store.accounts[index];
  if (account.username === 'DEV-ADMIN' || account.pno === 'DEV-ADMIN' || account.id === 'cms_developer_admin') {
    throw new Error('Root Developer Administrator account cannot be deleted.');
  }

  // Remove from store
  store.accounts.splice(index, 1);
  await writeAccountsStore(store);

  await recordAccountAudit({
    action: 'DELETE',
    performedByPno: developerAdminPno,
    performedByName: developerAdminName,
    targetAccountId: id,
    targetUsername: account.username,
    details: `Permanently deleted account for ${account.fullName} (${account.pno}) - ${account.role} at ${account.policeStation || account.district}.`,
    previousSnapshot: account,
  });

  return true;
}

export async function addSpecialStationAllocation(
  accountId: string,
  allocation: Omit<SpecialStationAllocation, 'id' | 'createdAt'>,
  developerAdminPno = 'DEV-ADMIN',
  developerAdminName = 'Developer Administrator'
): Promise<SpecialStationAllocation> {
  const store = await readAccountsStore();
  const account = store.accounts.find((a) => a.id === accountId);
  if (!account) throw new Error('Account not found.');

  const newAllocation: SpecialStationAllocation = {
    ...allocation,
    id: 'alloc_' + randomUUID().slice(0, 8),
    createdAt: new Date().toISOString(),
  };

  if (!account.specialAllocations) account.specialAllocations = [];
  account.specialAllocations.push(newAllocation);
  account.updatedAt = new Date().toISOString();
  await writeAccountsStore(store);

  await recordAccountAudit({
    action: 'SPECIAL_ALLOCATION',
    performedByPno: developerAdminPno,
    performedByName: developerAdminName,
    targetAccountId: accountId,
    targetUsername: account.username,
    details: `Special allocation added: ${newAllocation.policeStationNames.join(', ')} (${newAllocation.districtName}) Reason: ${newAllocation.assignmentReason}.`,
  });

  return newAllocation;
}

// Dynamic Account Statistics
export async function getAccountDistributionStats(): Promise<{
  totalAccounts: number;
  activeAccounts: number;
  byRole: Record<string, number>;
  byDistrict: Record<string, number>;
  byStation: Record<string, number>;
}> {
  const store = await readAccountsStore();
  const byRole: Record<string, number> = {};
  const byDistrict: Record<string, number> = {};
  const byStation: Record<string, number> = {};
  let activeCount = 0;

  for (const acc of store.accounts) {
    if (acc.status === 'ACTIVE') activeCount++;
    byRole[acc.role] = (byRole[acc.role] || 0) + 1;
    byDistrict[acc.district] = (byDistrict[acc.district] || 0) + 1;
    byStation[acc.policeStation] = (byStation[acc.policeStation] || 0) + 1;
  }

  return {
    totalAccounts: store.accounts.length,
    activeAccounts: activeCount,
    byRole,
    byDistrict,
    byStation,
  };
}
