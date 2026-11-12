import { NextResponse } from 'next/server';
import { z } from 'zod';
import {issueSession,sessionUser,sessionPrincipal,viewableOfficer,developerAdminUser,validLogin,sameOrigin,demoEnabled} from '@/lib/serverSession';
export const runtime='nodejs';
const cookieOptions=(req:Request)=>({httpOnly:true,sameSite:'strict' as const,secure:req.url.startsWith('https://'),path:'/',maxAge:8*3600});
export async function GET(req:Request){
  const principal=await sessionPrincipal(req);
  const user=await sessionUser(req);
  const viewAsActive=Boolean(principal&&principal.userId==='cms_developer_admin'&&principal.viewAs&&user&&user.id!=='cms_developer_admin');
  return NextResponse.json({user,sessionUser:viewAsActive?developerAdminUser():user,demoEnabled:demoEnabled(),viewAsActive},{status:user?200:401,headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
  try{const b=z.object({pno:z.string().max(100).optional(),pin:z.string().max(100).optional(),station:z.string().max(200).optional(),switchTo:z.string().max(100).optional(),viewAs:z.string().max(100).nullable().optional()}).parse(await req.json());
  if(b.switchTo)return NextResponse.json({error:'Persona switching is disabled. Developer Admin can enter an officer ID with their own session; sign out stays explicit.'},{status:403});
  // View-as: the Developer Admin enters another officer's ID with their own session.
  // No second login happens and the developer stays signed in until they sign out themselves.
  if(b.viewAs!==undefined){
    const principal=await sessionPrincipal(req);
    if(!principal)return NextResponse.json({error:'Login required.'},{status:401});
    if(principal.userId!=='cms_developer_admin')return NextResponse.json({error:'Only the Developer Admin can view another officer ID.'},{status:403});
    const developer=developerAdminUser();
    if(!b.viewAs){
      const response=NextResponse.json({user:developer,sessionUser:developer,viewAsActive:false});
      response.cookies.set('cms_session',issueSession(developer.id),cookieOptions(req));return response;
    }
    const target=await viewableOfficer(b.viewAs);
    if(!target)return NextResponse.json({error:'This officer ID could not be opened for viewing.'},{status:403});
    const response=NextResponse.json({user:target,sessionUser:developer,viewAsActive:true});
    response.cookies.set('cms_session',issueSession(developer.id,undefined,false,target.id),cookieOptions(req));return response;
  }
  const user = await validLogin(b.pno||'',b.pin||'');
  if(!user)return NextResponse.json({error:'Invalid PNO or PIN. Production login must be configured.'},{status:401});
  if(b.station && b.station !== user.stationName)return NextResponse.json({error:'Selected station does not match your assignment.'},{status:403});
  const response=NextResponse.json({user,sessionUser:user,viewAsActive:false});response.cookies.set('cms_session',issueSession(user.id, undefined, !user.unitId && user.id !== 'cms_developer_admin'),cookieOptions(req));return response;
  }catch{return NextResponse.json({error:'Invalid login request'},{status:400});}
}
export async function DELETE(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});const r=NextResponse.json({success:true});r.cookies.set('cms_session','',{httpOnly:true,path:'/',maxAge:0});return r;}
