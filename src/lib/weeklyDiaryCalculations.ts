import { fixedKey,dataKey,type DiaryPacket,type DiaryValue } from '@/lib/weeklyDiary';
export const WEEKLY_FORMULA_CELLS:Record<string,string>={
  'Performa!20:6':'C20+(E20-D20)',
  'Performa!21:7':'E21/F20',
  'Performa!22:7':'E22/F20',
};
export function diaryFormula(key:string) {
  return WEEKLY_FORMULA_CELLS[key] || (/^PARCHA-12!parcha:\d+:25$/.test(key)?'SUM(C:X)':'');
}
/** The source has text-described calculations, not embedded Excel formulas. */
export function calculateDiary(packet:DiaryPacket,edits:Record<string,string>={}) {
  const fixed={...packet.fixed},blocks={...packet.blocks};
  const effective=(key:string,base?:DiaryValue)=>key in edits?edits[key]:packet.overrides[key]?.value ?? base?.value;
  const number=(key:string,base?:DiaryValue)=>{const value=effective(key,base);return value!==undefined&&value.trim()!==''&&/^-?[\d,]+(?:\.\d+)?$/.test(value.trim())?Number(value.replaceAll(',','')):null;};
  const get=(r:number,c:number)=>{const k=fixedKey('Performa',r,c);return number(k,fixed[k]);};
  const calculated=(value:number,formula:string):DiaryValue=>({value:String(value),origin:'AUTO',source:'Calculation: '+formula});
  const p=get(20,3),q=get(20,4),r=get(20,5);
  const denominator=p!==null&&q!==null&&r!==null?p+(r-q):null;
  if(denominator!==null)fixed['Performa!20:6']=calculated(denominator,WEEKLY_FORMULA_CELLS['Performa!20:6']);
  else delete fixed['Performa!20:6'];
  for(const row of [21,22]) {
    const numerator=get(row,5),key=fixedKey('Performa',row,7);
    if(numerator!==null&&denominator!==null&&denominator!==0)fixed[key]=calculated(Number((numerator/denominator).toFixed(4)),WEEKLY_FORMULA_CELLS[key]);
    else delete fixed[key];
  }
  const parcha=packet.blocks.parcha || [];
  const overrides=Object.fromEntries(Object.entries(packet.overrides).filter(([key])=>!diaryFormula(key)));
  const indexes=[...Object.keys(overrides),...Object.keys(edits)].filter(k=>k.startsWith('PARCHA-12!parcha:')).map(k=>Number(k.split(':')[1])+1);
  blocks.parcha=Array.from({length:indexes.reduce((max,n)=>Math.max(max,n),Math.max(1,parcha.length))},(_,row)=>{
    const result={...parcha[row]};let total=0,complete=true;
    for(let c=3;c<=24;c++){const n=number(dataKey('PARCHA-12','parcha',row,c),result[String(c)]);if(n===null){complete=false;break;}total+=n;}
    if(complete)result['25']=calculated(total,'SUM(C:X)');else delete result['25'];return result;
  });
  return {...packet,fixed,blocks,overrides};
}
