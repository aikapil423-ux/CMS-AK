/** Resize one cell by sharing the remaining fixed row width among its siblings. */
export function fitDiaryRow(weights:number[],index:number,requested:number,total:number,min=20):number[] {
  if(!weights.length || index<0 || index>=weights.length || total<=0)return [];
  if(weights.length===1)return [total];
  const floor=Math.min(min,total/weights.length),chosen=Math.max(floor,Math.min(total-floor*(weights.length-1),requested));
  const surplus=total-chosen-floor*(weights.length-1);
  const others=weights.map((w,i)=>i===index?0:Math.max(0,w-floor)),sum=others.reduce((a,b)=>a+b,0);
  return weights.map((_,i)=>i===index?chosen:floor+surplus*(sum?others[i]/sum:1/(weights.length-1)));
}
export function diaryRowPercents(weights:number[]) {
  const safe=weights.map(w=>Number.isFinite(w)&&w>0?w:1),sum=safe.reduce((a,b)=>a+b,0);
  return safe.map(w=>w/sum*100);
}
export function fitDiaryRowMinimums(weights:number[],minimums:number[],total:number) {
  const sum=minimums.reduce((a,b)=>a+b,0);
  if(sum>=total)return diaryRowPercents(minimums).map(p=>p*total/100);
  const natural=diaryRowPercents(weights).map(p=>p*total/100),surplus=natural.map((w,i)=>Math.max(0,w-minimums[i])),available=surplus.reduce((a,b)=>a+b,0);
  return minimums.map((m,i)=>m+(total-sum)*(available?surplus[i]/available:1/weights.length));
}
export const diaryLandscape=(columns:number)=>columns>9;
export const diaryContentPixels=(columns:number)=>(diaryLandscape(columns)?277:190)*96/25.4;
