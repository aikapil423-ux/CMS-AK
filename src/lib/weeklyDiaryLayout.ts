import { diaryFormula } from '@/lib/weeklyDiaryCalculations';
import { WEEKLY_TEMPLATE,dataKey,fixedKey,emptyDiaryLayout,validDiaryKey,rebaseDiaryOverrides,type DiaryLayout,type DiaryPacket,type DiaryValue } from '@/lib/weeklyDiary';
export const mergeRowKey = (key:string) => key.slice(0,key.lastIndexOf(':'));

export function validColumnMerge(cells:string[]) {
  if(cells.length<2 || cells.some(key=>typeof key!=='string' || !validDiaryKey(key,true))
    || cells.slice(1).some(diaryFormula))return false;
  const anchor=cells[0], rowKey=mergeRowKey(anchor);
  const sheet=WEEKLY_TEMPLATE.sheets.find(item=>anchor.startsWith(item.name+'!'));
  if(!sheet)return false;
  const partIndex=sheet.parts.findIndex(item=>item.kind==='static'
    ? rowKey===sheet.name+'!'+item.template.row
    : rowKey.startsWith(sheet.name+'!'+item.key+':'));
  const part=sheet.parts[partIndex];
  const column=Number(anchor.slice(anchor.lastIndexOf(':')+1));
  const first=part?.template.cells.find(cell=>cell.col===column);
  if(!first || first.rowSpan!==1)return false;
  const startRow=Number(rowKey.slice(rowKey.lastIndexOf(':')+1));
  return cells.every((key,index)=>{
    if(part.kind==='data')return key===dataKey(sheet.name,part.key!,startRow+index,column);
    const next=sheet.parts[partIndex+index];
    const cell=next?.template.cells.find(item=>item.col===column);
    return next?.kind==='static' && cell?.rowSpan===1 && cell.span===first.span
      && key===fixedKey(sheet.name,next.template.row,column);
  });
}
export function validateDiaryLayout(value:unknown):DiaryLayout {
  if(!value || typeof value!=='object')throw Error('Invalid layout.');
  const input=value as DiaryLayout,result=emptyDiaryLayout();
  const row=(key:string)=>WEEKLY_TEMPLATE.sheets.some(s=>key.startsWith(s.name+'!')&&s.columns.some((_,i)=>validDiaryKey(key+':'+(i+1),true)));
  for(const [key,label] of Object.entries(input.labels || {})){if(!validDiaryKey(key,true)||typeof label!=='string'||label.length>30000)throw Error('Invalid field label.');result.labels[key]=label;}
  for(const [key,format] of Object.entries(input.cellFormats || {})){
    if(!validDiaryKey(key,true)||!format||typeof format!=='object'||(format.bold!==undefined&&typeof format.bold!=='boolean')||(format.italic!==undefined&&typeof format.italic!=='boolean')||(format.align!==undefined&&!['left','center','right'].includes(format.align))||(format.fontSize!==undefined&&(!Number.isFinite(format.fontSize)||format.fontSize<6||format.fontSize>36)))throw Error('Invalid cell format.');
    if(format.choices!==undefined && (!validDiaryKey(key) || diaryFormula(key) || !Array.isArray(format.choices)
      || format.choices.length>30 || format.choices.some(value=>typeof value!=='string' || !value.trim() || value.length>200))) throw Error('Invalid dropdown options.');
    if(format.highlightAbove!==undefined && !Number.isFinite(format.highlightAbove))throw Error('Invalid highlight threshold.');
    result.cellFormats[key]={bold:format.bold,italic:format.italic,align:format.align,fontSize:format.fontSize,choices:format.choices,highlightAbove:format.highlightAbove};
  }
  for(const [key,n] of Object.entries(input.tableWidths || {})){if(!WEEKLY_TEMPLATE.sheets.some(s=>s.parts.some(p=>p.kind==='static'&&s.columns.some((_,i)=>key===fixedKey(s.name,p.template.row,i+1))))||!Number.isFinite(n)||n<1||n>2000)throw Error('Invalid table column width.');result.tableWidths[key]=n;}
  for(const [key,n] of Object.entries(input.columnWidths || {})) {
    if(!WEEKLY_TEMPLATE.sheets.some(s=>s.columns.some((_,i)=>key===s.name+':'+(i+1)))||!Number.isFinite(n)||n<20||n>2000)throw Error('Invalid column width.');result.columnWidths[key]=n;
  }
  for(const [key,n] of Object.entries(input.rowHeights || {})){if(!row(key)||!Number.isFinite(n)||n<20||n>4000)throw Error('Invalid row height.');result.rowHeights[key]=n;}
  for(const [key,n] of Object.entries(input.cellWidths || {})){if(!validDiaryKey(key,true)||!Number.isFinite(n)||n<=0||n>100)throw Error('Invalid row cell width.');result.cellWidths[key]=n;}
  for(const [key,size] of Object.entries(input.fieldSizes || {})) {
    if(!validDiaryKey(key,true)||!size||!Number.isFinite(size.width)||!Number.isFinite(size.height)||size.width<20||size.width>2000||size.height<20||size.height>4000)throw Error('Invalid field size.');result.fieldSizes[key]=size;
  }
  for(const key of input.hiddenRows || []){if(!row(key))throw Error('Invalid hidden row.');result.hiddenRows.push(key);}
  for(const key of input.hiddenFields || []){if(!validDiaryKey(key,true))throw Error('Invalid hidden field.');result.hiddenFields.push(key);}
  for(const [key,count] of Object.entries(input.extraRows || {})){if(!WEEKLY_TEMPLATE.sheets.some(s=>s.parts.some(p=>p.key===key))||!Number.isInteger(count)||count<1||count>1048576)throw Error('Invalid row count.');result.extraRows[key]=count;}
  for(const [key,fields] of Object.entries(input.extraFields || {})) {
    if(!validDiaryKey(key,true)||!Array.isArray(fields))throw Error('Invalid added field.');
    result.extraFields[key]=fields.map(f=>{if(!f||typeof f.id!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(f.id)||typeof f.label!=='string'||f.label.length>500||typeof f.value!=='string'||f.value.length>30000)throw Error('Invalid added field.');return {id:f.id,label:f.label,value:f.value};});
  }
  for(const [name,rows] of Object.entries(input.customRows || {})) {
    const sheet=WEEKLY_TEMPLATE.sheets.find(s=>s.name===name);if(!sheet||!Array.isArray(rows))throw Error('Invalid added rows.');
    result.customRows[name]=rows.map(row=>{
      if(!row||typeof row.id!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(row.id)||!Array.isArray(row.cells)||row.cells.length!==sheet.columns.length)throw Error('Invalid added row.');
      return {id:row.id,cells:row.cells.map(c=>{if(!c||typeof c.value!=='string'||c.value.length>30000||!Number.isFinite(c.width)||c.width<20||c.width>2000||!Number.isFinite(c.height)||c.height<20||c.height>4000)throw Error('Invalid added cell.');return {value:c.value,width:c.width,height:c.height};})};
    });
  }
  for (const [key, formula] of Object.entries(input.formulas || {})) {
    if (!validDiaryKey(key) || diaryFormula(key) || typeof formula !== 'string'
      || !formula.startsWith('=') || formula.length < 2 || formula.length > 1024) throw Error('Invalid cell formula.');
    result.formulas[key] = formula;
  }
  const occupied = new Set<string>();
  for (const [anchor, cells] of Object.entries(input.merges || {})) {
    if (!Array.isArray(cells) || cells.length<2 || cells[0]!==anchor
      || cells.some(key=>typeof key!=='string' || occupied.has(key))) {
      throw Error('Invalid merge range.');
    }
    if(mergeRowKey(anchor)!==mergeRowKey(cells[1])){
      if(!validColumnMerge(cells) || cells.some(key=>result.hiddenRows.includes(mergeRowKey(key))))throw Error('Invalid merge range.');
      cells.forEach(key=>occupied.add(key));
      result.merges[anchor]=cells;
      continue;
    }
    const rowKey = anchor.slice(0, anchor.lastIndexOf(':'));
    const sheet = WEEKLY_TEMPLATE.sheets.find(item => anchor.startsWith(item.name + '!'));
    const part = sheet?.parts.find(item => item.kind === 'static'
      ? rowKey === sheet.name + '!' + item.template.row
      : rowKey.startsWith(sheet.name + '!' + item.key + ':'));
    if (!Array.isArray(cells) || cells.length < 2 || cells[0] !== anchor || !part) throw Error('Invalid merge.');
    let nextColumn = Number(anchor.slice(anchor.lastIndexOf(':') + 1));
    for (const key of cells) {
      const cell = part.template.cells.find(item => item.col === nextColumn);
      if (!cell || cell.rowSpan !== 1 || key !== rowKey + ':' + nextColumn || !validDiaryKey(key,true)
        || occupied.has(key) || (key !== anchor && diaryFormula(key))) throw Error('Invalid merge range.');
      occupied.add(key);
      nextColumn += cell.span;
    }
    result.merges[anchor] = cells;
  }
  return result;
}
export function rebaseDiaryLayout(old:DiaryPacket,next:DiaryPacket):DiaryLayout {
  const layout=validateDiaryLayout(old.layout || emptyDiaryLayout());
  const move=(key:string)=>Object.keys(rebaseDiaryOverrides({...old,overrides:{[key]:{value:'layout',origin:'MANUAL',source:'Layout'} as DiaryValue}},next))[0];
  const result={...layout,labels:{},cellFormats:{},cellWidths:{},fieldSizes:{},rowHeights:{},extraFields:{},hiddenFields:layout.hiddenFields.map(move),hiddenRows:layout.hiddenRows.map(k=>move(k+':1').slice(0,-2))} as DiaryLayout;
  for(const [key,label] of Object.entries(layout.labels))result.labels[move(key)]=label;
  for(const [key,format] of Object.entries(layout.cellFormats))result.cellFormats[move(key)]=format;
  for(const [key,width] of Object.entries(layout.cellWidths))result.cellWidths[move(key)]=width;
  for(const [key,size] of Object.entries(layout.fieldSizes))result.fieldSizes[move(key)]=size;
  for(const [key,height] of Object.entries(layout.rowHeights))result.rowHeights[move(key+':1').slice(0,-2)]=height;
  for(const [key,fields] of Object.entries(layout.extraFields))result.extraFields[move(key)]=fields;
  result.extraRows=Object.fromEntries(Object.entries(layout.extraRows).map(([key,n])=>[key,Math.max(1,n+(next.blocks[key]?.length || 0)-(old.blocks[key]?.length || 0))]));
  result.formulas = Object.fromEntries(Object.entries(layout.formulas).map(([key,formula])=>[move(key),formula]));
  result.merges = Object.fromEntries(Object.values(layout.merges).map(cells => {
    const moved = cells.map(move);
    if(mergeRowKey(cells[0])!==mergeRowKey(cells[1]) && !validColumnMerge(moved)){
      throw Error('Merged rows changed order. Unmerge the cells before refreshing.');
    }
    return [moved[0], moved];
  }));
  return result;
}
