import type { FIRItem } from '@/types';
import type { ComparativeCrimeRow } from '@/types/reports';

export function comparativeCrimeRows(firs:FIRItem[]):ComparativeCrimeRow[] {
  const groups:[ComparativeCrimeRow['category'],string,(f:FIRItem)=>boolean][]=[
    ['Crime Against Person','Bodily Offences (Murder/Hurt)',f=>/PERSON|ASSAULT|MURDER|HURT/.test(f.category)],
    ['Crime Against Women','Women Safety & Domestic Offences',f=>/WOMEN|DOMESTIC|DOWRY/.test(f.category)],
    ['Crime Against Property','Theft, Burglary & Robbery',f=>/PROPERTY|THEFT|BURGLARY|ROBBERY|SNATCHING/.test(f.category)],
    ['Local and Special Laws','Arms, Excise & Special Acts',f=>/ARMS|EXCISE|NDPS/.test(f.category)],
  ];
  const percentage=(list:FIRItem[],predicate:(f:FIRItem)=>boolean)=>list.length?Math.round(list.filter(predicate).length/list.length*1000)/10:0;
  return groups.map(([category,head,match])=>{
    const previous=firs.filter(f=>f.firYear===2025&&match(f));
    const current=firs.filter(f=>f.firYear===2026&&match(f));
    const chargesheet=(f:FIRItem)=>/CHARGESHEET/.test(f.status);
    const arrested=(f:FIRItem)=>!!f.accusedList?.some(a=>a.isArrested);
    const priorWorkout=percentage(previous,chargesheet),workout=percentage(current,chargesheet);
    const priorArrest=percentage(previous,arrested),arrest=percentage(current,arrested);
    return {category,head,reg2025:previous.length,reg2026:current.length,change:current.length-previous.length,
      changePct:previous.length?Math.round((current.length-previous.length)/previous.length*1000)/10:0,
      workoutPct2025:priorWorkout,workoutPct2026:workout,workoutChange:workout-priorWorkout,
      arrestRate2025:priorArrest,arrestRate2026:arrest,arrestRateChange:arrest-priorArrest};
  });
}
