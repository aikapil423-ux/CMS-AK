import { prisma } from '@/lib/prisma';
import { bailSchema, type BailRecord } from '@/lib/bailSchema';
import { z } from 'zod';
const requestSchema=z.object({id:z.string().uuid(),expectedVersion:z.number().int().nonnegative(),firId:z.string().min(1),policeStation:z.string().min(1),district:z.string().min(1),authorId:z.string().min(1),firSnapshot:z.object({policeStation:z.string(),district:z.string(),assignedIoId:z.string().optional(),assignedIoName:z.string().optional()}),data:bailSchema});
export class BailConflict extends Error {}
const output=(row:{id:string;firId:string;version:number;dataJson:string;createdAt:Date;updatedAt:Date}):BailRecord=>({id:row.id,firId:row.firId,version:row.version,data:JSON.parse(row.dataJson),createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString()});
type BailRow={id:string;firId:string;policeStation:string;version:number;dataJson:string;firSnapshotJson:string;createdAt:Date;updatedAt:Date};
export const bailDbService={
 async scope(firId:string){const rows=await prisma.$queryRaw<BailRow[]>`SELECT * FROM "FirBailDetail" WHERE "firId" = ${firId} LIMIT 1`;return rows[0];},
 async list(firId:string){return (await prisma.$queryRaw<BailRow[]>`SELECT * FROM "FirBailDetail" WHERE "firId" = ${firId} ORDER BY "createdAt" DESC`).map(output);},
 async save(input:unknown){
  const body=requestSchema.parse(input);
  const data={...body.data,permanentAddress:body.data.sameAddress?{...body.data.presentAddress}:body.data.permanentAddress};
  return prisma.$transaction(async tx=>{
   const [old]=await tx.$queryRaw<BailRow[]>`SELECT * FROM "FirBailDetail" WHERE "id" = ${body.id}`;
   if(old&&(old.firId!==body.firId||old.policeStation!==body.policeStation))throw new BailConflict('Bail record belongs to another FIR.');
   if(old&&body.expectedVersion===0&&old.version===1&&old.dataJson===JSON.stringify(data))return output(old);
   if((old?.version||0)!==body.expectedVersion)throw new BailConflict('Record changed. Reload before editing.');
   const values={firId:body.firId,accusedId:data.accusedId,policeStation:body.policeStation,district:body.district,firSnapshotJson:JSON.stringify(body.firSnapshot),dataJson:JSON.stringify(data),updatedBy:body.authorId};
   const now=new Date();
   if(!old){
    await tx.$executeRaw`INSERT INTO "FirBailDetail" ("id","firId","accusedId","policeStation","district","version","dataJson","firSnapshotJson","createdBy","updatedBy","createdAt","updatedAt") VALUES (${body.id},${body.firId},${data.accusedId},${body.policeStation},${body.district},1,${values.dataJson},${values.firSnapshotJson},${body.authorId},${body.authorId},${now},${now})`;
   }else{
    const count=await tx.$executeRaw`UPDATE "FirBailDetail" SET "accusedId"=${data.accusedId},"dataJson"=${values.dataJson},"firSnapshotJson"=${values.firSnapshotJson},"updatedBy"=${body.authorId},"updatedAt"=${now},"version"="version"+1 WHERE "id"=${body.id} AND "version"=${body.expectedVersion}`;
    if(count!==1)throw new BailConflict('Another edit was saved. Reload before editing.');
   }
   const [saved]=await tx.$queryRaw<BailRow[]>`SELECT * FROM "FirBailDetail" WHERE "id"=${body.id}`;
   return output(saved);
  });
 }
};
