import { z } from 'zod';
const text = z.string().trim().max(500);
const date = text.refine(v => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v), 'Enter a valid date');
const address = z.object({houseNo:text, street:text, locality:text, city:text, tehsil:text, country:text, state:text, district:text, policeStation:text, pincode:z.string().trim().max(20)});
export const bailSchema = z.object({
 accusedId:text.min(1,'Select an accused'), accusedName:text.min(1), advocateName:text.min(1,'Advocate name is required'),
 bailType:z.enum(['','Anticipatory','Regular','Interim']).refine(v=>v.length>0,'Bail type is required'), courtType:text.min(1,'Court type is required'),courtName:text,
 hearingDate:date.refine(v=>!!v,'Bail hearing date is required'),
 suretyType:z.enum(['Known','Unknown']),uid:text,firstName:text,middleName:text,lastName:text,alias:text,
 gender:text,relativeType:text,relativeName:text,idType:text,idNumber:text,occupation:text,
 mobileCountryCode:text,landlineCountryCode:text,landlineAreaCode:text,
 mobile:text.refine(v=>!v || /^\+?[0-9 -]{7,20}$/.test(v),'Invalid mobile number'),landline:text,email:z.union([z.literal(''),z.email()]),
 dob:date, birthYear:text, ageYears:text, ageMonths:text, ageFrom:text, ageTo:text,
 sameAddress:z.boolean(),presentAddress:address,permanentAddress:address,
 attachment:z.object({name:text.min(1),type:z.enum(['application/pdf','image/jpeg','image/png']),data:z.string().max(7000000)}).nullable(),
}).superRefine((v,ctx)=>{
 if(v.suretyType==='Known') {
  for(const key of ['firstName','gender','relativeType','relativeName'] as const) if(!v[key])ctx.addIssue({code:'custom',path:[key],message:`${key} is required for known surety`});
  for(const kind of (v.sameAddress ? ['presentAddress'] as const : ['presentAddress','permanentAddress'] as const)) for(const key of ['city','country','state','district'] as const) if(!v[kind][key])ctx.addIssue({code:'custom',path:[kind,key],message:`${kind}: ${key} is required`});
 }
 for(const key of ['birthYear','ageYears','ageMonths','ageFrom','ageTo'] as const)if(v[key]&&!/^\d+$/.test(v[key]))ctx.addIssue({code:'custom',path:[key],message:'Enter a positive whole number'});
 if(v.ageMonths&&Number(v.ageMonths)>11)ctx.addIssue({code:'custom',path:['ageMonths'],message:'Months must be 0–11'});
 if(v.ageFrom&&v.ageTo&&Number(v.ageFrom)>Number(v.ageTo))ctx.addIssue({code:'custom',path:['ageTo'],message:'Age range is reversed'});
 for(const key of ['mobileCountryCode','landlineCountryCode','landlineAreaCode'] as const)if(v[key]&&!/^\d{1,6}$/.test(v[key]))ctx.addIssue({code:'custom',path:[key],message:'Invalid phone code'});
 for(const kind of ['presentAddress','permanentAddress'] as const){const a=kind==='permanentAddress'&&v.sameAddress?v.presentAddress:v[kind];if(a.country==='INDIA'&&a.pincode&&!/^\d{6}$/.test(a.pincode))ctx.addIssue({code:'custom',path:[kind,'pincode'],message:'Enter a 6 digit pincode'});}
 if(v.attachment){const prefix=`data:${v.attachment.type};base64,`;if(Math.floor((v.attachment.data.length-prefix.length)*3/4)>5*1024*1024+2)ctx.addIssue({code:'custom',path:['attachment'],message:'Attachment exceeds 5 MB'});if(!v.attachment.data.startsWith(prefix)||! /^[A-Za-z0-9+/]*={0,2}$/.test(v.attachment.data.slice(prefix.length)))ctx.addIssue({code:'custom',path:['attachment'],message:'Invalid attachment'});}
});
export type BailData=z.infer<typeof bailSchema>;
export type BailRecord={id:string;firId:string;version:number;data:BailData;createdAt:string;updatedAt:string};
export function emptyBail():BailData {
 const address={houseNo:'',street:'',locality:'',city:'',tehsil:'',country:'INDIA',state:'',district:'',policeStation:'',pincode:''};
 return {accusedId:'',accusedName:'',advocateName:'',bailType:'',courtType:'',courtName:'',hearingDate:'',suretyType:'Known',uid:'',firstName:'',middleName:'',lastName:'',alias:'',gender:'',relativeType:'',relativeName:'',idType:'',idNumber:'',occupation:'',mobileCountryCode:'',landlineCountryCode:'',landlineAreaCode:'',mobile:'',landline:'',email:'',dob:'',birthYear:'',ageYears:'',ageMonths:'',ageFrom:'',ageTo:'',sameAddress:false,presentAddress:{...address},permanentAddress:{...address},attachment:null};
}
