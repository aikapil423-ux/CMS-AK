"use client";
import {useEffect} from 'react';

const dirtyDocuments = new Set<symbol>();
export function confirmUnsavedNavigation() {
  return dirtyDocuments.size === 0 || window.confirm('Unsaved document changes will be lost. Leave this page?');
}

export function useUnsavedDocument(dirty:boolean) {
  useEffect(()=>{
    if(!dirty)return;
    const token=Symbol();dirtyDocuments.add(token);
    // Record browser-history positions so a declined Back/Forward can be undone.
    let position=Number(history.state?.cmsDocumentPosition || 0),restoring=false;
    const push=history.pushState.bind(history),replace=history.replaceState.bind(history);
    replace({...history.state,cmsDocumentPosition:position},'');
    const wrappedPush:History['pushState']=(state,title,url)=>{position++;push({...state,cmsDocumentPosition:position},title,url);};
    const wrappedReplace:History['replaceState']=(state,title,url)=>replace({...state,cmsDocumentPosition:position},title,url);
    history.pushState=wrappedPush;history.replaceState=wrappedReplace;
    const pop=(event:PopStateEvent)=>{
      const next=Number(event.state?.cmsDocumentPosition ?? position-1);
      if(restoring){restoring=false;return;}
      if(!confirmUnsavedNavigation()){
        event.stopImmediatePropagation();restoring=true;history.go(position-next || 1);
      }else position=next;
    };
    window.addEventListener('popstate',pop,true);
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
    return ()=>{dirtyDocuments.delete(token);window.removeEventListener('beforeunload',unload);document.removeEventListener('click',navigate,true);window.removeEventListener('popstate',pop,true);if(history.pushState===wrappedPush)history.pushState=push;if(history.replaceState===wrappedReplace)history.replaceState=replace;};
  },[dirty]);
}
