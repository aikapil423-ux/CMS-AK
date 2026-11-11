import fs from 'node:fs/promises';
import path from 'node:path';
import { apiAccess } from '@/lib/apiSecurity';
import { isFirVisibleToUser } from '@/lib/firIntegrity';
import { canViewComplaint } from '@/utils/complaintPermissions';
import { readFirRecords } from '@/services/firRepository';
import { readComplaints } from '@/services/complaintRepository';
import { buildWeeklyDiary } from '@/lib/weeklyDiaryEngine';
import { validDiaryPeriod,validDiaryKey,rebaseDiaryOverrides,emptyDiaryLayout,type DiaryValue } from '@/lib/weeklyDiary';
import { readDiary,saveDiary } from '@/services/weeklyDiaryRepository';
import { evidenceOwner } from '@/lib/evidenceOwnership';
import type { UniversalEvidenceRecord } from '@/types/evidence';
import { calculateDiary,diaryFormula } from '@/lib/weeklyDiaryCalculations';
import { validateDiaryLayout,rebaseDiaryLayout } from '@/lib/weeklyDiaryLayout';
export const runtime='nodejs';
async function scoped(req:Request) {
  const user=await apiAccess(req);if(user instanceof Response)return user;
  const [allFirs,allComplaints]=await Promise.all([readFirRecords(),readComplaints()]);
  const firs=allFirs.filter(f=>isFirVisibleToUser(user,f)),complaints=allComplaints.filter(c=>canViewComplaint(user,c).allowed);
  const stations=[...new Set([...firs.map(f=>f.policeStation),...complaints.map(c=>c.policeStation),user.stationName].filter(Boolean))].sort();
  return {user,firs,complaints,stations};
}
export async function GET(req:Request) {
  try{const scope=await scoped(req);if(scope instanceof Response)return scope;return Response.json({stations:scope.stations},{headers:{'Cache-Control':'no-store'}});}
  catch{return Response.json({error:'Diary sources unavailable.'},{status:503});}
}
export async function POST(req:Request) {
  try {
    const scope=await scoped(req);if(scope instanceof Response)return scope;
    const {user}=scope,body=await req.json();
    if(typeof body.from!=='string'||typeof body.to!=='string'||!validDiaryPeriod(body.from,body.to))return Response.json({error:'Select a valid From–To date range up to today. Future dates are not allowed.'},{status:400});
    if(typeof body.station!=='string'||!scope.stations.includes(body.station))return Response.json({error:'Police station not available in your scope.'},{status:403});
    const old=await readDiary(user.id,body.from,body.to,body.station);
    if(body.action==='reset') {
      if(!old || old.revision!==body.revision)return Response.json({error:'Reload this diary before resetting.'},{status:409});
      return Response.json({packet:await saveDiary(user.id,calculateDiary({...old,overrides:{},layout:emptyDiaryLayout()}),body.revision)});
    }
    if(body.action==='save') {
      if(!old || old.revision!==body.revision)return Response.json({error:'Reload this diary before saving.'},{status:409});
      if(!body.overrides || typeof body.overrides!=='object'||Array.isArray(body.overrides))return Response.json({error:'Invalid diary edits.'},{status:400});
      const overrides:Record<string,DiaryValue>={};
      for(const [key,value] of Object.entries(body.overrides)) {
        if(!validDiaryKey(key)||diaryFormula(key)||typeof value!=='string'||value.length>30000)return Response.json({error:'Invalid field.'},{status:400});
        overrides[key]={value,origin:'MANUAL',source:'Officer edit'};
      }
      const layout=body.layout?validateDiaryLayout(body.layout):old.layout;
      for(const [key,edit] of Object.entries(overrides)){
        const choices=layout?.cellFormats?.[key]?.choices;
        if(choices?.length && edit.value && !choices.includes(edit.value)
          && old.overrides[key]?.value!==edit.value){
          return Response.json({error:'Select a permitted dropdown value.'},{status:400});
        }
      }
      const packet=await saveDiary(user.id,calculateDiary({...old,overrides,layout}),body.revision);return Response.json({packet});
    }
    if(body.action!=='build')return Response.json({error:'Invalid action.'},{status:400});
    const firs=scope.firs.filter(f=>f.policeStation===body.station),complaints=scope.complaints.filter(c=>c.policeStation===body.station);
    const caseIds=new Set([...firs.map(f=>f.id),...firs.map(f=>f.sourceComplaintId).filter(Boolean),...complaints.map(c=>c.id)]);
    let evidence:UniversalEvidenceRecord[]=[];
    try{evidence=JSON.parse(await fs.readFile(path.join(process.cwd(),'prisma','processed-evidence-store.json'),'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
    evidence=evidence.filter(e=>e.caseId&&caseIds.has(e.caseId)&&(user.role==='SUPER_ADMIN'||evidenceOwner(e)===user.id));
    const built=buildWeeklyDiary({from:body.from,to:body.to,station:body.station,district:user.district,firs,complaints,evidence});
    if(old){built.overrides=rebaseDiaryOverrides(old,built);built.layout=rebaseDiaryLayout(old,built);}
    let packet;
    try {packet=await saveDiary(user.id,calculateDiary(built),old?.revision || null);}
    catch(error) {
      if(!(error instanceof Error)||!error.message.startsWith('Diary changed'))throw error;
      const latest=await readDiary(user.id,body.from,body.to,body.station);
      if(!latest)throw error;
      packet=await saveDiary(user.id,calculateDiary({...built,overrides:rebaseDiaryOverrides(latest,built),layout:rebaseDiaryLayout(latest,built)}),latest.revision || null);
    }
    return Response.json({packet},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return Response.json({error:e instanceof Error?e.message:'Diary generation failed.'},{status:503});}
}
