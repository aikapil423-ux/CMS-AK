import { NextRequest } from 'next/server';
import { apiAccess } from '@/lib/apiSecurity';
import { authorizedAnalysisFir } from '@/services/caseAnalysisService';
import { POST as processEvidence } from '@/app/api/evidence/process/route';
export const runtime='nodejs';
export const maxDuration=300;
export async function POST(req:NextRequest) {
  const user=apiAccess(req);if(user instanceof Response)return user;
  try {
    const form=await req.formData(),id=form.get('caseId');
    const fir=typeof id==='string'?await authorizedAnalysisFir(id,user):null;
    if(!fir)return Response.json({error:'FIR not found or access denied.'},{status:404});
    form.set('module','FIR');form.set('caseNumber',fir.firNumber);form.set('deferCaseAnalysis','true');
    const headers=new Headers(req.headers);headers.delete('content-type');headers.delete('content-length');
    return processEvidence(new NextRequest(new URL('/api/evidence/process',req.url),{method:'POST',headers,body:form}));
  }catch{return Response.json({error:'Evidence upload failed.'},{status:500});}
}
