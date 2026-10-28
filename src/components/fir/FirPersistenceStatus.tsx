"use client";
import {useEffect,useState} from 'react';
import {useAuth} from '@/context/AuthContext';
import {firPersistence} from '@/services/persistentFirService';

export function FirPersistenceStatus(){
 const {currentUser}=useAuth();
 const [error,setError]=useState(firPersistence.getError),[retrying,setRetrying]=useState(false);
 useEffect(()=>firPersistence.subscribe(()=>setError(firPersistence.getError())),[]);
 if(!error)return null;
 return <div role="alert" className="m-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-950">
  FIR records could not be synchronized: {error} Changes are not confirmed on the server.
  <button disabled={retrying} className="ml-3 underline" onClick={async()=>{setRetrying(true);try{await firPersistence.hydrate(currentUser);}catch{/* Keep the error visible for retry. */}finally{setRetrying(false);}}}>{retrying?'Reloading…':'Reload FIR records'}</button>
 </div>;
}
