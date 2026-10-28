import { createHmac,randomBytes,timingSafeEqual,scryptSync } from 'node:crypto';
import { DEMO_USERS } from '@/lib/mockData';
const globals=globalThis as typeof globalThis & {cmsSessionSecret?:string};
function secret(){if(process.env.CMS_SESSION_SECRET){if(process.env.CMS_SESSION_SECRET.length<32)throw new Error('CMS_SESSION_SECRET must contain at least 32 characters.');return process.env.CMS_SESSION_SECRET;}if(process.env.NODE_ENV==='production')throw new Error('CMS_SESSION_SECRET is required.');return globals.cmsSessionSecret??=randomBytes(32).toString('hex');}
export function issueSession(userId:string, stationName?: string){const value=Buffer.from(JSON.stringify({userId,stationName,expires:Date.now()+8*3600000})).toString('base64url');return value+'.'+createHmac('sha256',secret()).update(value).digest('hex');}
export function sessionUser(req:Request){try{const cookie=req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('cms_session='))?.slice(12);if(!cookie)return null;const [value,sig]=cookie.split('.');if(!value||!sig||!/^[a-f0-9]{64}$/.test(sig))return null;const expected=createHmac('sha256',secret()).update(value).digest();if(!timingSafeEqual(expected,Buffer.from(sig,'hex')))return null;const data=JSON.parse(Buffer.from(value,'base64url').toString());if(data.expires<Date.now())return null;const found=DEMO_USERS.find(u=>u.id===data.userId);if(!found)return null;return data.stationName ? { ...found, stationName: data.stationName } : found;}catch{return null;}}
export function validLogin(pno:string,pin:string){const user=DEMO_USERS.find(u=>u.pno.replace(/[^a-z0-9]/gi,'').toLowerCase()===pno.replace(/[^a-z0-9]/gi,'').toLowerCase());if(!user)return null;
 let credentials:Record<string,string>={};try{credentials=JSON.parse(process.env.CMS_LOGIN_CREDENTIALS||'{}');}catch{return null;}
 const configured=credentials[user.pno] || (process.env.NODE_ENV!=='production'?process.env.CMS_LOGIN_PIN_HASH:undefined);
 if(configured){const [salt,hash]=configured.split(':');if(!salt||!hash||!/^[a-f0-9]{128}$/.test(hash))return null;return timingSafeEqual(scryptSync(pin,salt,64),Buffer.from(hash,'hex'))?user:null;}
 return process.env.NODE_ENV!=='production'&&pin==='123456'?user:null;
}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin;}
