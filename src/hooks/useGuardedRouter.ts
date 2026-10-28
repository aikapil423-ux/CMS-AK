"use client";
import { useRouter as useNextRouter } from 'next/navigation';
import {useMemo} from 'react';
import { confirmUnsavedNavigation } from './useUnsavedDocument';

/** All programmatic navigation observes the same document guard as links. */
export function useGuardedRouter() {
  const router=useNextRouter();
  return useMemo(()=>({...router,
    push:(...args:Parameters<typeof router.push>)=>{if(confirmUnsavedNavigation())router.push(...args);},
    replace:(...args:Parameters<typeof router.replace>)=>{if(confirmUnsavedNavigation())router.replace(...args);},
    back:()=>router.back(),
    forward:()=>router.forward(),
  }),[router]);
}
