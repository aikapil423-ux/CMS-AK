import type { ComplaintItem, FIRItem } from '@/types';
import type { UniversalEvidenceRecord } from '@/types/evidence';
import { diaryDate } from '@/lib/weeklyDiaryEngine';
import { isComplaintResolved } from '@/lib/complaintIntegrity';
import { igpCellKey, igpTables, type IgpBriefing } from '@/lib/igpTemplate';

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();
const firText = (fir: FIRItem) => normalize([fir.category, fir.categoryDisplay, fir.majorAct, fir.specialActs].filter(Boolean).join(' ').replaceAll('_', ' '));
const station = (value: string) => normalize(value).replace(/^(police station|ps)\s+/, '').replace(/\s*panipat$/, '').replace(/[^a-z0-9]/g, '').replace(/^sector(?:industrial)?29$|^industrialsector29$/, 'sector29');
const pct = (count: number, total: number) => total ? Math.round(count * 1000 / total) / 10 : undefined;
const before = (value: unknown, cutoff: string) => { const date = diaryDate(value); return !!date && date <= cutoff; };
const known = (fir: FIRItem, cutoff: string) => before(fir.updatedAt || fir.createdAt, cutoff);
const active = (fir: FIRItem) => ['REGISTERED', 'UNDER_INVESTIGATION', 'PENDING_SUPERVISORY_REVIEW'].includes(fir.status);
const workout = (fir: FIRItem) => fir.status === 'CHARGESHEET_FILED';

function crimeMatcher(label: string) {
  const name = normalize(label).split(' (')[0];
  const special: Record<string, RegExp> = {
    'mv theft': /motor vehicle theft|vehicle theft|mv theft/,
    'other simple theft': /simple theft|other theft/,
    'attempt to commit murder': /attempt(?: to commit| to)? murder/,
    'attempt to commit culpable homicide': /attempt(?: to commit)? culpable homicide/,
    'culpable homicide not amounting to murder': /culpable homicide/,
    'extortion & blackmail': /extortion|blackmail/,
    'dowry deaths': /dowry death/,
    'fraud & forgery': /fraud|forgery/,
    'public gambling act': /gambling/,
    'illicit arms & ammunition': /arms act|illicit arms/,
    'gambling act fir/kalandra': /gambling/,
    'molestation/sexual harassment': /molestation|sexual harassment/,
    'sexual intercourse other than rape': /sexual intercourse other than rape|false promise of marriage/,
  };
  if (name === 'pocso act') {
    if (/excl/i.test(label)) return (fir: FIRItem) => /pocso/.test(firText(fir)) && !!fir.actsAndSectionsList?.some(entry => /pocso/i.test(entry.act || '') && /^\s*(?:[789]|1[0-9])\b/.test(entry.sections || ''));
    return (fir: FIRItem) => /pocso/.test(firText(fir)) && !!fir.actsAndSectionsList?.some(entry => /pocso/i.test(entry.act || '') && /^\s*[46]\b/.test(entry.sections || ''));
  }
  if (name === 'murder') return (fir: FIRItem) => /\bmurder\b/.test(firText(fir)) && !/attempt|not amounting/.test(firText(fir));
  if (name === 'rape') return (fir: FIRItem) => /\brape\b/.test(firText(fir)) && !/attempt|other than/.test(firText(fir));
  if (name.startsWith('kidnapping & abduction')) return undefined; // Two distinct section groups in the source deck.
  const rule = special[name] || (name && !/total|crime against/.test(name) ? new RegExp('\\b'+name.replace(/[.*+?^$${}()|[\]\\]/g, '\\$&')+'\\b') : undefined);
  return rule ? (fir: FIRItem) => rule.test(firText(fir)) : undefined;
}

export function buildIgpBriefing(district: string, cutoff: string, records: FIRItem[], complaints: ComplaintItem[], evidence: UniversalEvidenceRecord[] = []): IgpBriefing {
  const processedByCase = new Map<string,UniversalEvidenceRecord>();
  for(const item of evidence){
    if(item.caseId && item.processingStatus==='COMPLETED' && before(item.updatedAt || item.createdAt,cutoff)){
      processedByCase.set(item.caseId,item);
    }
  }
  const values: IgpBriefing['values'] = {};
  const caseOverflow: IgpBriefing['caseOverflow'] = {};
  const set = (slide: number, table: number, row: number, column: number, value: string | number | undefined) => {
    if (value !== undefined && value !== '') values[igpCellKey(slide, table, row, column)] = value;
  };
  const write = (slide: number, table: number, row: number, start: number, entries: (string | number | undefined)[]) =>
    entries.forEach((value, index) => set(slide, table, row, start + index, value));
  const year = Number(cutoff.slice(0, 4));
  const periodEnd = (y: number) => {
    const month = Number(cutoff.slice(5, 7));
    const day = Math.min(Number(cutoff.slice(8)), new Date(Date.UTC(y, month, 0)).getUTCDate());
    return `${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  };
  const cohort = (y: number) => records.filter(fir => diaryDate(fir.firDate) >= `${y}-01-01` && before(fir.firDate, periodEnd(y)));
  const previous = cohort(year - 1), current = cohort(year);
  const asOf = records.filter(fir => before(fir.firDate, cutoff));
  const comparable = (list: FIRItem[], end: string, metric: string) => {
    if (metric === 'registered') return list.length || undefined;
    if (!list.length || !list.every(fir=>known(fir,end))) return undefined;
    if (metric.includes('work')) return pct(list.filter(workout).length, list.length);
    if (metric.includes('arrest') && list.every(fir=>fir.accusedList?.length && fir.accusedList.every(accused=>!accused.isArrested || diaryDate(accused.arrestDate)))) {
      const accused = list.flatMap(fir=>fir.accusedList || []);
      return pct(accused.filter(a=>a.isArrested && before(a.arrestDate,end)).length, list.length);
    }
  };
  for (const slide of [2,3,4,5,6,7,18]) {
    for (const [table, shape] of igpTables(slide).entries()) {
      let match: ReturnType<typeof crimeMatcher>;
      shape.rows.forEach((row, index) => {
        const label = row.find(cell=>cell.c===0)?.text;
        const metric = normalize(row.find(cell=>cell.c===1)?.text || '');
        if (label) match = crimeMatcher(label);
        if (!match || !metric) return;
        const a = comparable(previous.filter(match), periodEnd(year - 1), metric);
        const b = comparable(current.filter(match), cutoff, metric);
        const delta = a!==undefined && b!==undefined ? Math.round((b-a)*10)/10 : undefined;
        if(metric.includes('work'))write(slide,table,index,2,[a,b,undefined,delta]);
        else write(slide,table,index,2,[a,b,delta,metric==='registered' && delta!==undefined && a ? pct(delta,a) : undefined]);
      });
    }
  }
  const extortion = (fir:FIRItem) => /extortion|blackmail/.test(firText(fir));
  const extortionRows = [year-2,year-1,year].map(y=>asOf.filter(fir=>diaryDate(fir.firDate).startsWith(String(y)) && extortion(fir)));
  [...extortionRows,extortionRows.flat()].forEach((list,i)=>{
    if(!list.length)return;
    set(8,0,i+2,1,list.length);
    if(list.every(fir=>known(fir,cutoff))){
      write(8,0,i+2,2,[undefined,list.filter(f=>f.trackingState==='PART_B_PARTIAL').length,
        list.filter(f=>f.status==='UNTRACED').length,list.filter(f=>f.status==='CLOSURE_REPORT_FILED').length,
        list.filter(f=>f.status==='CANCELLED').length,list.filter(active).length]);
    }
  });
  const heinous = asOf.filter(fir=>(fir.isHeinous || fir.isHeinousCrime) && known(fir,cutoff) && active(fir));
  const heinousRules = [
    /\bmurder\b/, /attempt.*murder/, /dowry death/, /\brape\b/, /extortion|blackmail/,
    /pocso/, /snatching/, /false promise of marriage/,
  ];
  const classified = heinousRules.map((rule,i)=>heinous.filter(fir=>{
    const text=firText(fir);
    return rule.test(text) && (![0,3].includes(i) || !/attempt/.test(text));
  }));
  classified.forEach((list,i)=>{if(list.length)set(12,0,1,i,list.length);});
  const unique=new Set(classified.flat().map(fir=>fir.id));
  if(unique.size)set(12,0,1,8,unique.size);
  const lists = [
    {slide:12,table:1,category:0,start:2,available:3},
    {slide:13,table:0,category:1,start:2,available:3},
    {slide:13,table:0,category:2,start:7,available:2},
    {slide:14,table:0,category:3,start:2,available:5},
    {slide:15,table:0,category:4,start:2,available:5,continues:true},
    {slide:16,table:0,category:4,start:0,available:4,offset:5},
    {slide:17,table:0,category:5,start:2,available:2},
    {slide:17,table:0,category:6,start:6,available:2},
    {slide:17,table:0,category:7,start:10,available:1},
  ];
  for(const {slide,table,category,start,available,offset=0,continues} of lists){
    const entries=classified[category].slice(offset).map((fir,i)=>{
      const processed=(processedByCase.get(fir.id) || processedByCase.get(fir.sourceComplaintId || ''))?.structuredData;
      const sections=fir.actsAndSections || processed?.legalSections?.map(section=>section.section+' '+section.act).join(', ');
      return [i+offset+1,[fir.firNumber,fir.firDate,sections].filter(Boolean).join(' / '),
        fir.policeStation,fir.briefFacts || fir.incidentDetails || processed?.incident?.summary || processed?.incident?.details || ''];
    });
    entries.slice(0,available).forEach((entry,i)=>write(slide,table,i+start,0,entry));
    if(entries.length>available && !continues)caseOverflow[[slide,table,start+available-1].join(':')]=entries.slice(available);
  }
  const cyber = (record:{category?:string;categoryDisplay?:string}) => /cyber/i.test([record.category,record.categoryDisplay].join(' '));
  [year-1,year].forEach((y,i)=>{
    const end=periodEnd(y);
    const list=complaints.filter(c=>diaryDate(c.createdAt)>=`${y}-01-01` && before(c.createdAt,end) && cyber(c));
    const firs=cohort(y).filter(cyber);
    if(list.length)set(25,0,1,i+1,list.length);
    if(list.length && list.every(c=>before(c.updatedAt || c.createdAt,end))){
      set(25,0,2,i+1,list.filter(c=>!isComplaintResolved(c)).length);
    }
    if(firs.length){
      const cyberStation=firs.filter(fir=>/cyber/.test(normalize(fir.policeStation))).length;
      set(25,0,5,i+1,['Total FIR: '+firs.length,'PS Cyber: '+cyberStation,'Other PS: '+(firs.length-cyberStation)].join('\n'));
    }
    if(list.length && firs.length && firs.every(f=>f.sourceComplaintId)){
      const ids=new Set(list.map(c=>c.id));
      set(25,0,6,i+1,pct(new Set(firs.filter(f=>ids.has(f.sourceComplaintId!)).map(f=>f.sourceComplaintId)).size,list.length));
    }
    if(firs.length && firs.every(f=>known(f,end)))set(25,0,8,i+1,pct(firs.filter(workout).length,firs.length));
  });
  const pendency = asOf.filter(f=>known(f,cutoff) && active(f) && (!f.trackingState || f.trackingState==='PART_A_FRESH'));
  const age = (f:FIRItem) => (Date.parse(cutoff)-Date.parse(diaryDate(f.firDate)))/86400000;
  const rolling = asOf.filter(f=>diaryDate(f.firDate)>periodEnd(year-1));
  for(const slide of [9,10,11]){
    const rows=igpTables(slide)[0].rows;
    const start=slide===10?3:2;
    rows.slice(start).forEach((row,index)=>{
      const name=row.find(c=>c.c===1)?.text;
      const total=/^total$|^grand total$/i.test(name || row[0].text);
      if(!name && !total)return;
      const scoped=asOf.filter(f=>total || station(f.policeStation)===station(name || ''));
      if(!scoped.length)return;
      const matches=(f:FIRItem)=>total || station(f.policeStation)===station(name || '');
      const list=pendency.filter(matches);
      const registered=rolling.filter(matches).length;
      if(slide!==11)set(slide,0,index+start,2,registered);
      if(!scoped.every(fir=>known(fir,cutoff)))return;
      if(slide===10){
        const statuses=['PART_B_PARTIAL','PART_B_REOPEN','PART_B_UNDER_CHECKING'] as const;
        const grouped=statuses.map(status=>scoped.filter(fir=>fir.trackingState===status));
        const counts=grouped.flatMap((group,i)=>{
          if(i===2){
            // Under-checking age needs the dated checking event, not the FIR date.
            return [undefined,undefined,undefined,group.length];
          }
          return [group.filter(f=>age(f)<=180).length,group.filter(f=>age(f)>180&&age(f)<=365).length,
            group.filter(f=>age(f)>365).length,group.length];
        });
        const pending=grouped.reduce((sum,group)=>sum+group.length,0);
        write(slide,0,index+start,3,[...counts,pending,pct(pending,registered)]);
        return;
      }
      const band=(min:number,max=Infinity)=>list.filter(f=>age(f)>min && age(f)<=max).length;
      if(slide===11){set(slide,0,index+2,2,band(365));return;}
      write(slide,0,index+2,2,[registered,band(730),band(365,730),band(180,365),band(180),pct(band(180),list.length),band(90,180),band(-1,90),list.length,pct(list.length,registered)]);
    });
  }
  const traffic = current.filter(fir=>/road accident|rash driving|traffic accident/.test(firText(fir)));
  igpTables(26)[0].rows.slice(2).forEach((row,index)=>{
    const label=row[0].text;
    const list=traffic.filter(fir=>/^total$/i.test(label) || station(fir.policeStation)===station(label));
    if(list.length)set(26,0,index+2,1,list.length);
  });
  for(const slide of [21,22]){
    if(slide===22){
      for(let i=0;i<4;i++){
        const y=year-3+i;
        const list=(i===3?current:asOf.filter(f=>diaryDate(f.firDate).startsWith(String(y)))).filter(f=>/ndps|narcotic/.test(firText(f)));
        if(list.length)set(22,0,1,i+1,list.length);
      }
    }else{
      igpTables(21)[0].rows.slice(2).forEach((row,i)=>{
        const match=crimeMatcher(row[1].text);
        if(!match)return;
        const a=previous.filter(match).length,b=current.filter(match).length;
        if(a)set(21,0,i+2,2,a);
        if(b)set(21,0,i+2,3,b);
      });
    }
  }
  return {district,cutoff,values,caseOverflow};
}
