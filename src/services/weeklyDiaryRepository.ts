import { readRuntimeJson, usesPostgresStore, writeRuntimeJson } from "@/lib/runtimeJsonStore";
import { prisma } from "@/lib/prisma";
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import type { DiaryPacket } from '@/lib/weeklyDiary';
const root=()=>path.join(process.cwd(),'prisma','weekly-diary');
const file=(owner:string,from:string,to:string,station:string)=>path.join(root(),createHash('sha256').update(JSON.stringify([owner,from,to,station])).digest('hex')+'.json');
const diaryKey = (target: string) => 'weekly-diary/' + path.basename(target);
const diaryConflict = () => Error('Diary changed in another tab. Reload this date range before saving.');
let queue:Promise<unknown>=Promise.resolve();
export async function readDiary(owner:string,from:string,to:string,station:string):Promise<DiaryPacket|null> {
  const target = file(owner,from,to,station);
  if (usesPostgresStore()) {
    const [row] = await prisma.$queryRaw<{ payload: DiaryPacket }[]>`
      SELECT payload FROM "WeeklyDiaryRecord" WHERE key = ${diaryKey(target)}
        AND ("ownerId" = ${owner} OR "ownerId" IS NULL)`;
    return row?.payload ?? null;
  }
  try{return await readRuntimeJson<DiaryPacket>(target);}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}
}
export async function saveDiary(owner:string,packet:DiaryPacket,expected:string|null,action: 'BUILD'|'SAVE'|'RESET' = 'BUILD') {
  const next = {...packet, revision: randomUUID()};
  const target = file(owner,packet.from,packet.to,packet.station);
  if (usesPostgresStore()) {
    return prisma.$transaction(async tx => {
      const key = diaryKey(target);
      const payload = JSON.stringify(next);
      const updated = await tx.$executeRaw`
        UPDATE "WeeklyDiaryRecord" SET "ownerId" = ${owner}, revision = ${next.revision}, payload = ${payload}::jsonb
        WHERE key = ${key} AND ("ownerId" = ${owner} OR "ownerId" IS NULL)
          AND revision IS NOT DISTINCT FROM ${expected}`;
      if (!updated) {
        if (expected !== null) throw diaryConflict();
        const inserted = await tx.$executeRaw`
          INSERT INTO "WeeklyDiaryRecord" (key, "ownerId", station, "fromDate", "toDate", revision, payload)
          VALUES (${key}, ${owner}, ${packet.station}, ${packet.from}, ${packet.to}, ${next.revision}, ${payload}::jsonb)
          ON CONFLICT (key) DO NOTHING`;
        if (!inserted) throw diaryConflict();
      }
      await tx.$executeRaw`INSERT INTO "CaseDocumentEvent" (kind, "recordId", "officerId", action)
        VALUES ('WEEKLY_DIARY', ${key}, ${owner}, ${action})`;
      return next;
    });
  }
  const run=queue.then(async()=>{
    const old=await readDiary(owner,packet.from,packet.to,packet.station);
    if((old?.revision || null)!==expected)throw diaryConflict();
    await fs.mkdir(root(),{recursive:true});
    await writeRuntimeJson(target, next);
    return next;
  });queue=run.catch(()=>undefined);return run;
}
