import { apiAccess } from '@/lib/apiSecurity';
import { authorizedAnalysisFir } from '@/services/caseAnalysisService';
import { listPdfScrutiny, readPdfScrutiny, savePdfScrutiny, deletePdfScrutiny } from '@/services/scrutinyRepository';
import { prepareScrutinyFields } from '@/services/scrutinyAutofill';
import { SCRUTINY_FIELDS, type ScrutinyValues } from '@/lib/scrutinyPdfTemplate';

export const runtime='nodejs';
export const maxDuration=180;
export async function GET(req:Request) {
  const user=await apiAccess(req);if(user instanceof Response)return user;
  try{return Response.json({records:await listPdfScrutiny(user)},{headers:{'Cache-Control':'no-store'}});}
  catch{return Response.json({error:'Saved scrutiny records could not be loaded.'},{status:503});}
}
export async function POST(req:Request) {
  const user=await apiAccess(req);if(user instanceof Response)return user;
  try {
    const body=await req.json();
    if(typeof body.firId!=='string')return Response.json({error:'Select FIR.'},{status:400});
    const fir=await authorizedAnalysisFir(body.firId,user);
    if(!fir)return Response.json({error:'FIR not found or access denied.'},{status:404});
    const previous=body.id ? await readPdfScrutiny(body.id,user):null;
    if(body.id && (!previous || previous.firId!==fir.id))return Response.json({error:'Record not found or access denied.'},{status:404});
    if(body.accusedIndex!==undefined && (!Number.isInteger(body.accusedIndex) || body.accusedIndex<0 || body.accusedIndex>=Math.max(1,fir.accusedList?.length || 0)))return Response.json({error:'Invalid selected accused.'},{status:400});
    let fields:ScrutinyValues={},warnings:string[]|undefined;
    if(body.action==='prepare') {
      const prepared=await prepareScrutinyFields(fir,user,previous?.accusedIndex ?? (Number.isInteger(body.accusedIndex)&&body.accusedIndex>=0?body.accusedIndex:0));
      fields={...prepared.fields};warnings=prepared.warnings;
      for(const [id,value] of Object.entries(previous?.fields || {}))if(value.origin==='MANUAL')fields[id]=value;
    } else if(body.action==='save' && body.fields && typeof body.fields==='object') {
      for(const [id,input] of Object.entries(body.fields)) {
        const def=SCRUTINY_FIELDS.find(f=>f.id===id), value=input as {value?:unknown};
        const photo=id==='identity.photo' && typeof value?.value==='string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value.value);
        if(!def || !value || typeof value.value!=='string' || value.value.length>(photo?2000000:12000) || (def.check && !['','yes','no','na'].includes(value.value)))return Response.json({error:'Invalid form field.'},{status:400});
        const existing=previous?.fields[id];
        // Client cannot assert AI provenance or a source it has not received.
        fields[id]=existing && existing.value===value.value?existing:{value:value.value,origin:'MANUAL'};
      }
    } else return Response.json({error:'Invalid action.'},{status:400});
    if(body.decision && !['DRAFT','PASSED','OBJECTION_RETURNED','PENDING_FSL'].includes(body.decision))return Response.json({error:'Invalid decision.'},{status:400});
    if(body.challanType && !['FINAL_CHARGESHEET','SUPPLEMENTARY','CANCELLATION','UNTRACED'].includes(body.challanType))return Response.json({error:'Invalid challan type.'},{status:400});
    for(const key of ['courtName','scrutinyOfficer','objectionsNote'])if(body[key]!==undefined && (typeof body[key]!=='string' || body[key].length>12000))return Response.json({error:'Invalid workflow details.'},{status:400});
    const record=await savePdfScrutiny({id:body.id,firId:fir.id,revision:body.revision,fields,status:body.action==='save'?'SAVED':'DRAFT',warnings,accusedIndex:body.accusedIndex,decision:body.decision,courtName:body.courtName,scrutinyOfficer:body.scrutinyOfficer,challanType:body.challanType,objectionsNote:body.objectionsNote},user);
    return Response.json({record},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return Response.json({error:e instanceof Error?e.message:'Scrutiny save failed.'},{status:409});}
}
export async function DELETE(req:Request) {
  const user=await apiAccess(req);if(user instanceof Response)return user;
  const id=new URL(req.url).searchParams.get('id');if(!id)return Response.json({error:'ID required.'},{status:400});
  try {await deletePdfScrutiny(id,user);return Response.json({success:true});}
  catch{return Response.json({error:'Record not found or access denied.'},{status:404});}
}
