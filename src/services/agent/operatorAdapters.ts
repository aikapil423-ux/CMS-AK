import type { WebsiteSnapshot } from './websiteOperator';

export interface OperatorReceipt {id:string;label:string;url?:string;revision?:number}
export interface OperatorAdapter {
  id:string; matches:(path:string)=>boolean;
  /** Module-owned permission policy. Must never elevate the application's permissions. */
  canOperate?:(controlId:string,operation:'fill'|'click')=>boolean;
  /** Return the actual saved record/receipt from module state after success, never a guess. */
  receipt?:()=>OperatorReceipt | undefined;
  enrich?:(snapshot:WebsiteSnapshot)=>WebsiteSnapshot;
}
const adapters=new Map<string,OperatorAdapter>();
export function registerOperatorAdapter(adapter:OperatorAdapter):()=>void {
  adapters.set(adapter.id,adapter);return ()=>{if(adapters.get(adapter.id)===adapter)adapters.delete(adapter.id);};
}
export function operatorAdapters(path:string):OperatorAdapter[] {return [...adapters.values()].filter(a=>a.matches(path));}
