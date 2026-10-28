"use client";
import React,{createContext,useContext,useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {UserSession} from '@/types';
import {DEMO_USERS} from '@/lib/mockData';
import {firPersistence} from '@/services/persistentFirService';
interface AuthContextType {currentUser:UserSession;switchUser:(id:string)=>Promise<void>;availableUsers:UserSession[];isAuthenticated:boolean;logout:()=>void;login:(pno:string,pin:string,station?:string)=>Promise<boolean>}
const AuthContext=createContext<AuthContextType|undefined>(undefined);
export function AuthProvider({children}:{children:React.ReactNode}){
 const router=useRouter();
 const [currentUser,setCurrentUser]=useState(DEMO_USERS[0]),[isAuthenticated,setAuthenticated]=useState(false),[ready,setReady]=useState(false);
 async function accept(user:UserSession){setAuthenticated(false);localStorage.setItem('haryana_police_cms_user',user.id);localStorage.removeItem('cms_demo_logged_out');await firPersistence.hydrate(user).catch(()=>{});setCurrentUser(user);setAuthenticated(true);window.dispatchEvent(new CustomEvent('cms_user_switched',{detail:user}));}
 useEffect(()=>{let active=true;fetch('/api/auth/session',{cache:'no-store'}).then(async r=>{const b=await r.json();if(active&&r.ok&&b.user)await accept(b.user);}).catch(()=>{}).finally(()=>{if(active)setReady(true);});return()=>{active=false;};},[]);
 const login=async(pno:string,pin:string,station?:string)=>{try{const r=await fetch('/api/auth/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pno,pin,station})});const b=await r.json();if(!r.ok)return false;await accept(b.user);return true;}catch{return false;}};
 const switchUser=async(id:string)=>{await firPersistence.flush().catch(()=>{});const r=await fetch('/api/auth/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({switchTo:id})});const b=await r.json();if(r.ok)await accept(b.user);else window.dispatchEvent(new CustomEvent('complaints_save_error',{detail:b.error||'Sign in before switching officers.'}));};
 const logout=async()=>{await firPersistence.flush().catch(()=>{});await fetch('/api/auth/session',{method:'DELETE'});setAuthenticated(false);localStorage.removeItem('haryana_police_cms_user');router.replace('/login');};
 if(!ready)return <div className="p-6 text-sm text-slate-600">Loading session…</div>;
 return <AuthContext.Provider value={{currentUser,isAuthenticated,availableUsers:DEMO_USERS,switchUser,login,logout}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const context=useContext(AuthContext);if(!context)throw new Error('useAuth must be used within an AuthProvider');return context;}
