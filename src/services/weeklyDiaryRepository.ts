import { readRuntimeJson, writeRuntimeJson } from "@/lib/runtimeJsonStore";
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import type { DiaryPacket } from '@/lib/weeklyDiary';
const root=()=>path.join(process.cwd(),'prisma','weekly-diary');
const file=(owner:string,from:string,to:string,station:string)=>path.join(root(),createHash('sha256').update(JSON.stringify([owner,from,to,station])).digest('hex')+'.json');
let queue:Promise<unknown>=Promise.resolve();
export async function readDiary(owner:string,from:string,to:string,station:string):Promise<DiaryPacket|null> {
  try{return await readRuntimeJson<DiaryPacket>(file(owner,from,to,station));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}
}
export async function saveDiary(owner:string,packet:DiaryPacket,expected:string|null) {
  const run=queue.then(async()=>{
    const old=await readDiary(owner,packet.from,packet.to,packet.station);
    if((old?.revision || null)!==expected)throw Error('Diary changed in another tab. Reload this date range before saving.');
    const next={...packet,revision:randomUUID()};await fs.mkdir(root(),{recursive:true});
    await writeRuntimeJson(file(owner,packet.from,packet.to,packet.station), next);
    return next;
  });queue=run.catch(()=>undefined);return run;
}
