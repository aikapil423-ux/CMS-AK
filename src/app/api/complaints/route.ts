import {NextResponse} from 'next/server';
import {z} from 'zod';
import {sessionUser,sameOrigin} from '@/lib/serverSession';
import {readComplaints,saveComplaintChanges,ComplaintAccessError,ComplaintConflict} from '@/services/complaintRepository';
import {canViewComplaint} from '@/utils/complaintPermissions';
import {computeDaysPending} from '@/lib/complaintIntegrity';
export const runtime='nodejs';
function failure(e:unknown){const status=e instanceof z.ZodError||e instanceof SyntaxError?400:e instanceof ComplaintAccessError?403:e instanceof ComplaintConflict?409:503;return NextResponse.json({success:false,error:e instanceof Error?e.message:'Complaint save failed'},{status});}
export async function GET(req:Request){const user=sessionUser(req);if(!user)return NextResponse.json({error:'Login required'},{status:401});try{const complaints=(await readComplaints()).filter(c=>canViewComplaint(user,c).allowed).map(c=>({...c,daysPending:computeDaysPending(c)}));return NextResponse.json({success:true,complaints},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(req:Request){const user=sessionUser(req);if(!user)return NextResponse.json({error:'Login required'},{status:401});if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});try{return NextResponse.json({success:true,complaints:await saveComplaintChanges(await req.json(),user)});}catch(e){return failure(e);}}
