import templateJson from './weeklyDiaryTemplate.json';
export interface DiaryTemplateCell {col:number;span:number;rowSpan:number;label:string;editable:boolean;bold:boolean;align:string;fill:string|null;fontColor:string;fontName:string;fontSize:number;vertical:string;borders:Record<string,string|null>;}
export interface DiaryTemplateRow {row:number;height:number;cells:DiaryTemplateCell[];}
export interface DiaryPart {kind:string;key?:string;template:DiaryTemplateRow;}
export interface DiarySheet {name:string;columns:number[];parts:DiaryPart[];landscape:boolean;}
export const WEEKLY_TEMPLATE=templateJson as {version:string;sheets:DiarySheet[]};
export interface DiaryValue {value:string;origin:'AUTO'|'MANUAL';source:string;sourceId?:string;}
export type DiaryRow=Record<string,DiaryValue>;
export interface DiaryLayout {
  columnWidths:Record<string,number>;rowHeights:Record<string,number>;fieldSizes:Record<string,{width:number;height:number}>;
  cellWidths:Record<string,number>;
  tableWidths:Record<string,number>;
  labels:Record<string,string>;
  cellFormats:Record<string,{bold?:boolean;italic?:boolean;align?:'left'|'center'|'right';fontSize?:number}>;
  hiddenRows:string[];hiddenFields:string[];extraRows:Record<string,number>;
  extraFields:Record<string,{id:string;label:string;value:string}[]>;
  customRows:Record<string,{id:string;cells:{value:string;width:number;height:number}[]}[]>;
}
export const emptyDiaryLayout=():DiaryLayout=>({columnWidths:{},tableWidths:{},cellWidths:{},labels:{},cellFormats:{},rowHeights:{},fieldSizes:{},hiddenRows:[],hiddenFields:[],extraRows:{},extraFields:{},customRows:{}});
export interface DiaryPacket {version:string;from:string;to:string;station:string;fixed:Record<string,DiaryValue>;blocks:Record<string,DiaryRow[]>;overrides:Record<string,DiaryValue>;layout?:DiaryLayout;warnings:string[];generatedAt:string;revision?:string;}
export const fixedKey=(sheet:string,row:number,col:number)=>`${sheet}!${row}:${col}`;
export const dataKey=(sheet:string,block:string,row:number,col:number)=>`${sheet}!${block}:${row}:${col}`;
export function diaryToday(now=new Date()) {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function validDiaryPeriod(from:string,to:string,today=diaryToday()) {
  const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  return valid(from)&&valid(to)&&from<=to&&to<=today;
}
export function validDiaryKey(key:string,includeLabels=false) {
  for(const sheet of WEEKLY_TEMPLATE.sheets) {
    if(!key.startsWith(sheet.name+'!'))continue;
    const tail=key.slice(sheet.name.length+1);
    for(const part of sheet.parts) {
      if(part.kind==='static' && part.template.cells.some(c=>(c.editable || includeLabels) && tail===`${part.template.row}:${c.col}`))return true;
      if(part.kind==='data' && part.key) {
        const prefix=part.key+':';if(!tail.startsWith(prefix))continue;
        const [row,col]=tail.slice(prefix.length).split(':').map(Number);
        if(Number.isInteger(row)&&row>=0&&row<1048576&&part.template.cells.some(c=>c.col===col))return true;
      }
    }
  }return false;
}
/** Keep manual notes attached to the same case when sorted/age-band rows move. */
export function rebaseDiaryOverrides(old:DiaryPacket,next:DiaryPacket) {
  const rebased:Record<string,DiaryValue>={};
  for(const [key,value] of Object.entries(old.overrides)) {
    let mapped=false;
    for(const sheet of WEEKLY_TEMPLATE.sheets) {
      if(!key.startsWith(sheet.name+'!'))continue;
      const tail=key.slice(sheet.name.length+1);
      for(const part of sheet.parts.filter(p=>p.kind==='data'&&p.key)) {
        const prefix=part.key+':';if(!tail.startsWith(prefix))continue;
        const [index,col]=tail.slice(prefix.length).split(':').map(Number),prior=old.blocks[part.key!]?.[index];
        if(!prior){const nextIndex=(next.blocks[part.key!]?.length || 0)+Math.max(0,index-(old.blocks[part.key!]?.length || 0));rebased[dataKey(sheet.name,part.key!,nextIndex,col)]=value;mapped=true;break;}
        const id=prior['2']?.sourceId;
        const matches:{block:string;row:number}[]=[];
        for(const candidate of sheet.parts.filter(p=>p.kind==='data'&&p.key)) {
          (next.blocks[candidate.key!] || []).forEach((r,i)=>{
            if(id && r['2']?.sourceId===id)matches.push({block:candidate.key!,row:i});
          });
        }
        const exact=matches.length>1?matches.filter(m=>Object.entries(prior).filter(([c])=>c!=='1').every(([c,v])=>next.blocks[m.block][m.row][c]?.value===v.value)):matches;
        if(exact.length!==1)throw Error('A manually edited case changed table or is no longer in this period. Its saved diary was retained; review or clear its manual edits before refreshing.');
        rebased[dataKey(sheet.name,exact[0].block,exact[0].row,col)]=value;mapped=true;break;
      }
    }
    if(!mapped)rebased[key]=value;
  }
  return rebased;
}
