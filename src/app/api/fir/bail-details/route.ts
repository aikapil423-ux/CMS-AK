import { readFirRecords } from "@/services/firRepository";
import { apiAccess } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { bailDbService, BailConflict } from '@/services/bailDbService';
import { isFirVisibleToUser } from '@/lib/firIntegrity';
export const runtime='nodejs';
function failure(error:unknown){
 if(error instanceof z.ZodError)return NextResponse.json({error:error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')},{status:400});
 if(error instanceof SyntaxError)return NextResponse.json({error:'Invalid JSON request'},{status:400});
 if(error instanceof BailConflict)return NextResponse.json({error:error.message},{status:409});
 console.error('Bail persistence failed',error);return NextResponse.json({error:'Bail details could not be saved or loaded. Please retry.'},{status:503});
}
// Identity comes exclusively from the verified session cookie.
function actor(req:NextRequest){const access=apiAccess(req);return access instanceof Response?null:access;}
export async function GET(req:NextRequest){
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

 if(!actor(req))return NextResponse.json({error:'Officer identity required'},{status:401});
 const firId=req.nextUrl.searchParams.get('firId');if(!firId)return NextResponse.json({error:'FIR ID required'},{status:400});
 try {const scope=(await readFirRecords()).find(f=>f.id===firId);
 if(!scope||!isFirVisibleToUser(apiUser,scope))return NextResponse.json({error:'Access denied'},{status:403});
 const records=await bailDbService.list(firId);
 return NextResponse.json({records},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return failure(error);}
}
const requestSchema=z.object({id:z.string().uuid(),expectedVersion:z.number().int().nonnegative(),data:z.unknown(),fir:z.object({id:z.string().min(1),policeStation:z.string().min(1),district:z.string().min(1),assignedIoId:z.string().optional(),assignedIoName:z.string().optional(),accusedList:z.array(z.object({id:z.string().optional(),name:z.string()}))})});
export async function POST(req:NextRequest){
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

 const user=actor(req);if(!user)return NextResponse.json({error:'Officer identity required'},{status:401});
 try{const body=requestSchema.parse(await req.json());const canonical=(await readFirRecords()).find(f=>f.id===body.fir.id);if(!canonical)return NextResponse.json({error:"Save or import the FIR before adding bail details."},{status:409});body.fir={...canonical,accusedList:canonical.accusedList || []};if(!isFirVisibleToUser(user,body.fir))return NextResponse.json({error:'Access denied'},{status:403});
 const {bailSchema}=await import('@/lib/bailSchema');const data=bailSchema.parse(body.data);
 if(!body.fir.accusedList.some((a,i)=>(a.id||`accused-${i}`)===data.accusedId&&a.name===data.accusedName))return NextResponse.json({error:'Select an accused from this FIR'},{status:400});
 return NextResponse.json({record:await bailDbService.save({...body,data,firId:body.fir.id,policeStation:body.fir.policeStation,district:body.fir.district,authorId:user.id,firSnapshot:body.fir})});
 }catch(error){return failure(error);}
}
