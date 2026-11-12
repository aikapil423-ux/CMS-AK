import { createHmac, randomBytes, timingSafeEqual, scryptSync } from 'node:crypto';
import { DEMO_USERS } from '@/lib/mockData';
import type { UserSession } from '@/types';

const globals = globalThis as typeof globalThis & { cmsSessionSecret?: string };
export const demoEnabled = () => process.env.NODE_ENV !== 'production'
  || process.env.ENABLE_DEMO_LOGIN === 'true'
  || process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true';

function secret() {
  const configured = process.env.CMS_SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === 'production' && !demoEnabled()) throw new Error('CMS_SESSION_SECRET must contain at least 32 characters.');
  return globals.cmsSessionSecret ??= randomBytes(32).toString('hex');
}

export function developerAdminUser(): UserSession {
  return { ...DEMO_USERS[0], id: 'cms_developer_admin', pno: 'DEV-ADMIN', name: 'Developer Admin',
    role: 'SUPER_ADMIN', roleDisplay: 'Developer Administrator', rankDisplay: 'Developer Administrator',
    stationName: 'CMS Administration', stationCode: 'CMS-ADMIN', district: 'All Districts' };
}

export function issueSession(userId: string, _legacyStation?: string, demo = false) {
  const value = Buffer.from(JSON.stringify({ userId, demo, version: 3, expires: Date.now() + 8 * 3600000 })).toString('base64url');
  return value + '.' + createHmac('sha256', secret()).update(value).digest('hex');
}

async function officerSession(user: { id: string; pno: string; fullName: string; rank: string; role: string; status: string; unit: {id: string; name: string; code: string; district: string} }): Promise<UserSession | null> {
  if (user.status !== 'ACTIVE') return null;
  const { prisma } = await import('@/lib/prisma');
  const units = user.role === 'DSP_SUBDIV' ? await prisma.policeUnit.findMany({
    where: { district: user.unit.district }, select: { id: true, parentId: true, name: true },
  }) : [];
  const scope = new Set([user.unit.id]);
  for (let pass = 0; pass < units.length; pass++) {
    for (const unit of units) if (unit.parentId && scope.has(unit.parentId)) scope.add(unit.id);
  }
  return {
    id: user.id, pno: user.pno, name: user.fullName,
    rank: user.rank as UserSession['rank'], rankDisplay: user.rank,
    role: user.role as UserSession['role'], roleDisplay: user.role,
    stationName: user.unit.name, stationCode: user.unit.code, district: user.unit.district,
    unitId: user.unit.id, jurisdictionUnits: units.filter(unit => scope.has(unit.id)).map(unit => unit.name),
  };
}

export async function sessionUser(req: Request): Promise<UserSession | null> {
  try {
    const cookie = req.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith('cms_session='))?.slice(12);
    if (!cookie) return null;
    const [value, signature, extra] = cookie.split('.');
    if (extra || !value || !/^[a-f0-9]{64}$/.test(signature ?? '')) return null;
    const expected = createHmac('sha256', secret()).update(value).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return null;
    const data = JSON.parse(Buffer.from(value, 'base64url').toString());
    if (data.version !== 3 || !Number.isFinite(data.expires) || data.expires <= Date.now() || typeof data.userId !== 'string') return null;
    if (data.userId === 'cms_developer_admin') return (demoEnabled() || process.env.CMS_DEVELOPER_ADMIN_PASSWORD) ? developerAdminUser() : null;
    if (data.demo) return demoEnabled() ? DEMO_USERS.find(user => user.id === data.userId) ?? null : null;
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({ where: { id: data.userId }, include: { unit: true } });
    return user ? await officerSession(user) : null;
  } catch {
    return null;
  }
}

export async function validLogin(pno: string, pin: string): Promise<UserSession | null> {
  if (pno.trim().toUpperCase() === 'DEV-ADMIN') {
    // Demo mode: one-click developer access. Operational deployments still require the configured password.
    if (demoEnabled() && pin === '123456') return developerAdminUser();
    const password = process.env.CMS_DEVELOPER_ADMIN_PASSWORD;
    if (!password) return null;
    const supplied = createHmac('sha256', secret()).update(pin).digest();
    const expected = createHmac('sha256', secret()).update(password).digest();
    return timingSafeEqual(supplied, expected) ? developerAdminUser() : null;
  }
  // Test personas must work even when the VM database has not been seeded.
  if (demoEnabled() && pin === '123456') {
    const demo = DEMO_USERS.find(candidate => candidate.pno.toUpperCase() === pno.trim().toUpperCase());
    if (demo) return demo;
  }
  const { prisma } = await import('@/lib/prisma');
  const user = await prisma.user.findUnique({ where: { pno: pno.trim().toUpperCase() }, include: { unit: true } });
  if (user) {
    const [salt, hash, extra] = user.passwordHash.split(':');
    if (extra || !salt || !/^[a-f0-9]{128}$/.test(hash ?? '')) return null;
    return timingSafeEqual(scryptSync(pin, salt, 64), Buffer.from(hash, 'hex')) ? officerSession(user) : null;
  }
  if (!demoEnabled() || pin !== '123456') return null;
  return DEMO_USERS.find(candidate => candidate.pno.toUpperCase() === pno.trim().toUpperCase()) ?? null;
}

export function sameOrigin(req:Request){
 const origin=req.headers.get('origin');
 if(!origin)return true;
 try{
  const originHost=new URL(origin).host;
  const hosts=[req.headers.get('x-forwarded-host'),req.headers.get('host')]
   .filter((value):value is string=>Boolean(value))
   .flatMap(value=>value.split(','))
   .map(value=>value.trim())
   .filter(Boolean);
  if(hosts.includes(originHost))return true;
  if(origin===new URL(req.url).origin)return true;
  // Allow test VM IP or local network host connections
  const allowed=(process.env.CMS_ALLOWED_ORIGINS || '').split(',').map(value=>value.trim()).filter(Boolean);
  if(allowed.includes(origin)) return true;
 }catch{}
 return false;
}
