"use client";
import {useEffect} from 'react';

export function useUnsavedDocument(dirty:boolean) {
  useEffect(()=>{
    if(!dirty)return;
    const unload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    const navigate=(event:MouseEvent)=>{
      const link=(event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement|null;
      if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
      const destination=new URL(link.href,location.href);
      if(destination.pathname===location.pathname&&destination.search===location.search)return;
      if(!window.confirm('Unsaved document changes will be lost. Leave this page?')){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();}
    };
    window.addEventListener('beforeunload',unload);
    document.addEventListener('click',navigate,true);
    return ()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',navigate,true);};
  },[dirty]);
}
