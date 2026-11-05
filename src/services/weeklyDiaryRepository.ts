import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import type { DiaryPacket } from '@/lib/weeklyDiary';
const root=()=>path.join(process.cwd(),'prisma','weekly-diary');
const file=(owner:string,from:string,to:string,station:string)=>path.join(root(),createHash('sha256').update(JSON.stringify([owner,from,to,station])).digest('hex')+'.json');
let queue:Promise<unknown>=Promise.resolve();
export async function readDiary(owner:string,from:string,to:string,station:string):Promise<DiaryPacket|null> {
  try{return JSON.parse(await fs.readFile(file(owner,from,to,station),'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}
}
export async function saveDiary(owner:string,packet:DiaryPacket,expected:string|null) {
  const run=queue.then(async()=>{
    const old=await readDiary(owner,packet.from,packet.to,packet.station);
    if((old?.revision || null)!==expected)throw Error('Diary changed in another tab. Reload this date range before saving.');
    const next={...packet,revision:randomUUID()};await fs.mkdir(root(),{recursive:true});
    const target=file(owner,packet.from,packet.to,packet.station),temp=target+'.'+randomUUID()+'.tmp';
    try{await fs.writeFile(temp,JSON.stringify(next,null,2),{mode:0o600});await fs.rename(temp,target);}finally{await fs.rm(temp,{force:true});}return next;
  });queue=run.catch(()=>undefined);return run;
}
