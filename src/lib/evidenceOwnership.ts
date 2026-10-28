import {DEMO_USERS} from '@/lib/mockData';
import type {UniversalEvidenceRecord} from '@/types/evidence';

/** Legacy uploads are attributed only when the stored full officer name is unique. */
export function evidenceOwner(record:UniversalEvidenceRecord):string | undefined {
 if(record.ownerId)return record.ownerId;
 const name=record.rawDocument?.uploadedBy?.trim().toLowerCase();
 if(!name)return undefined;
 const matches=DEMO_USERS.filter(user=>user.name.trim().toLowerCase()===name);
 return matches.length===1?matches[0].id:undefined;
}
