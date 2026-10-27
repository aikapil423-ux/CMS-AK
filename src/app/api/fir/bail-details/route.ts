import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { bailDbService, BailConflict } from '@/services/bailDbService';
import { DEMO_USERS } from '@/lib/mockData';
import { isFirVisibleToUser } from '@/lib/firIntegrity';
export const runtime='nodejs';
function failure(error:unknown){
 if(error instanceof z.ZodError)return NextResponse.json({error:error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')},{status:400});
 if(error instanceof SyntaxError)return NextResponse.json({error:'Invalid JSON request'},{status:400});
 if(error instanceof BailConflict)return NextResponse.json({error:error.message},{status:409});
 console.error('Bail persistence failed',error);return NextResponse.json({error:'Bail details could not be saved or loaded. Please retry.'},{status:503});
}
// Uses the application's current demo officer identity, as do its other FIR workflows.
function actor(req:NextRequest){return DEMO_USERS.find(u=>u.id===req.headers.get('x-cms-user'));}
export async function GET(req:NextRequest){
 if(!actor(req))return NextResponse.json({error:'Officer identity required'},{status:401});
 const firId=req.nextUrl.searchParams.get('firId');if(!firId)return NextResponse.json({error:'FIR ID required'},{status:400});
 try {const records=await bailDbService.list(firId);const scope=await bailDbService.scope(firId);
 if(scope&&!isFirVisibleToUser(actor(req),JSON.parse(scope.firSnapshotJson)))return NextResponse.json({error:'Access denied'},{status:403});
 return NextResponse.json({records},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return failure(error);}
}
const requestSchema=z.object({id:z.string().uuid(),expectedVersion:z.number().int().nonnegative(),data:z.unknown(),fir:z.object({id:z.string().min(1),policeStation:z.string().min(1),district:z.string().min(1),assignedIoId:z.string().optional(),assignedIoName:z.string().optional(),accusedList:z.array(z.object({id:z.string().optional(),name:z.string()}))})});
export async function POST(req:NextRequest){
 const user=actor(req);if(!user)return NextResponse.json({error:'Officer identity required'},{status:401});
 try{const body=requestSchema.parse(await req.json());if(!isFirVisibleToUser(user,body.fir))return NextResponse.json({error:'Access denied'},{status:403});
 const {bailSchema}=await import('@/lib/bailSchema');const data=bailSchema.parse(body.data);
 if(!body.fir.accusedList.some((a,i)=>(a.id||`accused-${i}`)===data.accusedId&&a.name===data.accusedName))return NextResponse.json({error:'Select an accused from this FIR'},{status:400});
 return NextResponse.json({record:await bailDbService.save({...body,data,firId:body.fir.id,policeStation:body.fir.policeStation,district:body.fir.district,authorId:user.id,firSnapshot:body.fir})});
 }catch(error){return failure(error);}
}
