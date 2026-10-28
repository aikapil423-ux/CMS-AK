import { apiAccess } from '@/lib/apiSecurity';
import { isFirVisibleToUser } from '@/lib/firIntegrity';
import { readFirRecords,saveFirRecords,FirRepositoryConflict,FirRepositoryAccessError } from '@/services/firRepository';
import { z } from 'zod';
export const runtime='nodejs';
export async function GET(req:Request){
  const user=apiAccess(req);if(user instanceof Response)return user;
  try{return Response.json({records:(await readFirRecords()).filter(f=>isFirVisibleToUser(user,f))},{headers:{'Cache-Control':'no-store'}});}
  catch{return Response.json({error:'FIR records could not be loaded.'},{status:503});}
}
export async function POST(req:Request){
  const user=apiAccess(req);if(user instanceof Response)return user;
  try{return Response.json({records:await saveFirRecords((await req.json()).changes,user)},{headers:{'Cache-Control':'no-store'}});}
  catch(error){return Response.json({error:error instanceof Error?error.message:'FIR save failed.'},{status:error instanceof FirRepositoryAccessError?403:error instanceof FirRepositoryConflict?409:error instanceof z.ZodError||error instanceof SyntaxError?400:503});}
}
