import { NextResponse } from 'next/server';
import { z } from 'zod';
import {issueSession,sessionUser,validLogin,sameOrigin,demoEnabled} from '@/lib/serverSession';
import {DEMO_USERS} from '@/lib/mockData';
export const runtime='nodejs';
export async function GET(req:Request){const user=await sessionUser(req);return NextResponse.json({user,demoEnabled:demoEnabled()},{status:user?200:401,headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 try{const b=z.object({pno:z.string().max(100).optional(),pin:z.string().max(100).optional(),station:z.string().max(200).optional(),switchTo:z.string().optional()}).parse(await req.json());
 const allowDemoSwitch = demoEnabled();
 let user = b.switchTo && allowDemoSwitch ? DEMO_USERS.find(u=>u.id===b.switchTo) : await validLogin(b.pno||'',b.pin||'');
 if(!user)return NextResponse.json({error:'Invalid PNO or PIN. Production login must be configured.'},{status:401});
 if(b.station && b.station !== user.stationName)return NextResponse.json({error:'Selected station does not match your assignment.'},{status:403});
 const response=NextResponse.json({user});response.cookies.set('cms_session',issueSession(user.id, undefined, !user.unitId),{httpOnly:true,sameSite:'strict',secure:req.url.startsWith('https://'),path:'/',maxAge:8*3600});return response;
 }catch{return NextResponse.json({error:'Invalid login request'},{status:400});}
}
export async function DELETE(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});const r=NextResponse.json({success:true});r.cookies.set('cms_session','',{httpOnly:true,path:'/',maxAge:0});return r;}
