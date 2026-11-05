'use client';
import { useEffect,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent,type KeyboardEvent as ReactKeyboardEvent,type ClipboardEvent as ReactClipboardEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WEEKLY_TEMPLATE,fixedKey,dataKey,validDiaryPeriod,diaryToday,validDiaryKey,emptyDiaryLayout,type DiaryLayout,type DiaryPacket,type DiaryValue,type DiaryTemplateRow,type DiarySheet } from '@/lib/weeklyDiary';
import { weeklyDiaryPrintHtml } from '@/lib/weeklyDiaryPrint';
import { diaryRowPercents,fitDiaryRow,fitDiaryRowMinimums,diaryContentPixels,diaryLandscape } from '@/lib/weeklyDiaryGeometry';
import { calculateDiary,diaryFormula } from '@/lib/weeklyDiaryCalculations';

type RowResize={table?:{sheet:string;header:number;columns:number[][];rows:string[]};keys:string[];weights:number[];width:number;index:number;rowKey:string;cellKey:string;height:number;custom?:{sheet:string;id:string}};
function DiaryResizeHandles({info,disabled,start,move,end}:{info:RowResize;disabled:boolean;start:(e:ReactPointerEvent<HTMLElement>,info:RowResize,axis:'x'|'y'|'both')=>void;move:(e:ReactPointerEvent<HTMLElement>)=>void;end:(e:ReactPointerEvent<HTMLElement>)=>void}) {
    return (['x','y','both'] as const).map(axis=><button key={axis} type="button" data-no-print className="no-print" aria-label={axis==='x'?'Drag cell width':axis==='y'?'Drag row height':'Drag cell width and height'}
      disabled={disabled} tabIndex={-1} title={info.table?"Drag to resize the whole table column":"Drag to resize this row only"} onClick={e=>e.stopPropagation()} onPointerDown={e=>start(e,info,axis)} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
      style={{position:'absolute',zIndex:3,padding:0,border:0,background:axis==='both'?'#94a3b844':'transparent',touchAction:'none',minWidth:0,minHeight:0,
        ...(axis==='x'?{right:-3,top:0,width:7,height:'100%',cursor:'col-resize'}:axis==='y'?{bottom:-3,left:0,height:7,width:'100%',cursor:'row-resize'}:{right:0,bottom:0,width:10,height:10,cursor:'nwse-resize'})}} />);
}

export function WeeklyDiaryWorkbook() {
  const {currentUser}=useAuth();
  const [from,setFrom]=useState(''),[to,setTo]=useState(''),[stations,setStations]=useState<string[]>([]),[station,setStation]=useState(currentUser.stationName || '');
  const [active,setActive]=useState('Performa'),[packet,setPacket]=useState<DiaryPacket|null>(null),[edits,setEdits]=useState<Record<string,string>>({});
  const [error,setError]=useState(''),[errorKey,setErrorKey]=useState(''),[saved,setSaved]=useState(''),[refresh,setRefresh]=useState(0),[busy,setBusy]=useState(false);
  const [added,setAdded]=useState<Record<string,number>>({}),[source,setSource]=useState('');
  const [layout,setLayout]=useState<DiaryLayout>(emptyDiaryLayout),[layoutDirty,setLayoutDirty]=useState(false);
  const [selected,setSelected]=useState<{key:string;sheet:string;col:number;rowKey:string;span:number;group?:RowResize}|null>(null);
  const resizeStart=useRef<{width:number;height:number;groupWidth?:number}|null>(null);
  const drag=useRef<(RowResize&{x:number;y:number;axis:'x'|'y'|'both'})|null>(null);
  const generation=useRef(0);
  const printFrame=useRef<HTMLIFrameElement|null>(null);
  const today=diaryToday();
  const query=JSON.stringify([from,to,station,refresh]),valid=validDiaryPeriod(from,to)&&!!station;
  const [loadedKey,setLoadedKey]=useState('');
  const [editingLabel,setEditingLabel]=useState<string|null>(null);
  const [history,setHistory]=useState<{edits:Record<string,string>;layout:DiaryLayout}[]>([]),[redo,setRedo]=useState<typeof history>([]);
  const matching=valid && packet?.from===from&&packet.to===to&&packet.station===station?calculateDiary(packet,edits):null;
  const loading=valid&&loadedKey!==query&&errorKey!==query;
  useEffect(()=>{
    const controller=new AbortController();fetch('/api/reports/weekly-diary',{credentials:'same-origin',cache:'no-store',signal:controller.signal}).then(async r=>{const result=await r.json();if(!r.ok)throw Error(result.error);return result;}).then(r=>setStations(r.stations)).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();
  },[]);
  useEffect(()=>()=>{printFrame.current?.remove();},[]);
  useEffect(()=>{
    if(!valid)return;const controller=new AbortController(),seq=++generation.current;
    fetch('/api/reports/weekly-diary',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({action:'build',from,to,station})})
      .then(async r=>{const result=await r.json();if(!r.ok)throw Error(result.error || 'Diary could not be generated.');return result;})
      .then(r=>{if(seq===generation.current){setPacket(r.packet);setLayout({...emptyDiaryLayout(),...r.packet.layout});setHistory([]);setRedo([]);setEditingLabel(null);setLayoutDirty(false);setSelected(null);setLoadedKey(query);setEdits({});setAdded({});setError('');setErrorKey('');setSaved('Generated diary saved in backend.');}})
      .catch(e=>{if(!controller.signal.aborted&&seq===generation.current){setError(e.message);setErrorKey(query);}});
    return()=>controller.abort();
  },[from,to,station,query,valid]);
  function changePeriod(set:(v:string)=>void,value:string) {
    if((Object.keys(edits).length || layoutDirty)&&!confirm('Save your edits before switching dates/station, or continue without these unsaved edits?'))return;
    set(value);setEdits({});setLayout(emptyDiaryLayout());setLayoutDirty(false);setAdded({});setSelected(null);setSaved('');setSource('');
  }
  function remember(){setHistory(old=>[...old.slice(-99),{edits,layout}]);setRedo([]);}
  function editLayout(change:(old:DiaryLayout)=>DiaryLayout,track=true){if(track)remember();setLayout(change);setLayoutDirty(true);setSaved('');}
  function editValue(key:string,text:string){remember();setEdits(old=>({...old,[key]:text}));setSaved('');}
  function undoEdit(forward=false){
    const stack=forward?redo:history,last=stack[stack.length-1];if(!last)return;
    if(forward){setRedo(stack.slice(0,-1));setHistory(old=>[...old,{edits,layout}]);}else{setHistory(stack.slice(0,-1));setRedo(old=>[...old,{edits,layout}]);}
    setAdded({});setEdits(last.edits);setLayout(last.layout);setLayoutDirty(true);setSaved('');
  }
  function gridKeys(e:ReactKeyboardEvent<HTMLElement>){
    if(!matching||busy||loading)return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undoEdit(e.shiftKey);return;}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();undoEdit(true);return;}
    const target=e.target;if(!(target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement))return;
    const items=Array.from(e.currentTarget.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('textarea,input[data-diary-label]')).filter(c=>!c.disabled&&!c.readOnly),index=items.indexOf(target);if(index<0)return;
    let direction=0,vertical=false;
    if(e.key==='Tab'){direction=e.shiftKey?-1:1;}
    else if(e.key==='Enter'&&!e.shiftKey){direction=1;vertical=true;}
    else if(e.key==='ArrowUp'&&target.selectionStart===0){direction=-1;vertical=true;}
    else if(e.key==='ArrowDown'&&target.selectionStart===target.value.length){direction=1;vertical=true;}
    else if(e.key==='ArrowLeft'&&target.selectionStart===0)direction=-1;
    else if(e.key==='ArrowRight'&&target.selectionStart===target.value.length)direction=1;
    if(!direction)return;e.preventDefault();
    const col=target.closest('td')?.dataset.diaryColumn;
    const same=vertical?items.filter(c=>c.closest('td')?.dataset.diaryColumn===col):items,pos=same.indexOf(target),next=same[(pos+direction+same.length)%same.length];next?.focus();next?.select();
  }
  function pasteCells(e:ReactClipboardEvent<HTMLElement>){
    if(!matching||busy||loading)return;const target=e.target;if(!(target instanceof HTMLTextAreaElement))return;
    const key=target.dataset.diaryField,text=e.clipboardData.getData('text/plain');if(!key || (!text.includes('\t')&&!/<table[\s>]/i.test(e.clipboardData.getData('text/html'))))return;
    e.preventDefault();const sheet=WEEKLY_TEMPLATE.sheets.find(s=>s.name===active)!;
    const block=sheet.parts.find(p=>p.kind==='data'&&key.startsWith(sheet.name+'!'+p.key+':'));
    const tail=key.slice((sheet.name+'!'+(block?block.key+':':'')).length).split(':').map(Number),startRow=tail[0],startCol=tail[1];
    const rows=text.replace(/\r\n/g,'\n').replace(/\n$/,'').split('\n'),changes:Record<string,string>={};
    rows.forEach((line,r)=>line.split('\t').forEach((value,c)=>{const id=block?dataKey(sheet.name,block.key!,startRow+r,startCol+c):fixedKey(sheet.name,startRow+r,startCol+c);if(validDiaryKey(id)&&!diaryFormula(id))changes[id]=value;}));
    remember();setEdits(old=>({...old,...changes}));setSaved('');
    if(block){const count=Math.min(1048576,startRow+rows.length);setLayout(old=>({...old,extraRows:{...old.extraRows,[block.key!]:Math.max(count,old.extraRows[block.key!] || 0)}}));setLayoutDirty(true);}
  }
  function applyRowResize(info:RowResize,widths:number[]|null,height:number|null,track=true) {
    editLayout(old=>{
      if(info.custom) {
        const {sheet,id}=info.custom;
        return {...old,customRows:{...old.customRows,[sheet]:(old.customRows[sheet] || []).map(r=>r.id!==id?r:{...r,cells:r.cells.map((c,i)=>({...c,width:widths?.[i] ?? c.width,height:height!==null&&i===info.index?height:c.height}))})}};
      }
      if(info.table && widths){
        const {sheet,header,columns,rows}=info.table;
        const tableWidths={...old.tableWidths};
        columns.forEach((cols,i)=>{const template=WEEKLY_TEMPLATE.sheets.find(s=>s.name===sheet)!;const total=cols.reduce((n,c)=>n+(old.tableWidths?.[fixedKey(sheet,header,c)] || template.columns[c-1]),0);cols.forEach(col=>{tableWidths[fixedKey(sheet,header,col)]=widths[i]*(old.tableWidths?.[fixedKey(sheet,header,col)] || template.columns[col-1])/total;});});
        const cellWidths=Object.fromEntries(Object.entries(old.cellWidths).filter(([key])=>!rows.some(prefix=>key.startsWith(prefix))));
        return {...old,tableWidths,cellWidths,rowHeights:height===null?old.rowHeights:{...old.rowHeights,[info.rowKey]:height}};
      }
      const percentages=widths?diaryRowPercents(widths):null;
      return {...old,cellWidths:{...old.cellWidths,...(percentages?Object.fromEntries(info.keys.map((k,i)=>[k,percentages[i]])):{})},
        rowHeights:height===null?old.rowHeights:{...old.rowHeights,[info.rowKey]:height},
        fieldSizes:height===null?old.fieldSizes:{...old.fieldSizes,[info.cellKey]:{width:old.fieldSizes[info.cellKey]?.width || 200,height}}};
    },track);
  }
  function startResize(e:ReactPointerEvent<HTMLElement>,info:RowResize,axis:'x'|'y'|'both') {
    if(!matching||loading||busy)return;e.preventDefault();e.stopPropagation();remember();
    const width=e.currentTarget.closest('table')?.getBoundingClientRect().width || info.width;
    const height=e.currentTarget.closest('tr')?.getBoundingClientRect().height || info.height;
    const scale=width/info.width;
    drag.current={...info,width,weights:info.weights.map(w=>w*scale),height,x:e.clientX,y:e.clientY,axis};
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function moveResize(e:ReactPointerEvent<HTMLElement>) {
    const info=drag.current;if(!info)return;e.preventDefault();
    const widths=info.axis==='y'?null:fitDiaryRow(info.weights,info.index,info.weights[info.index]+e.clientX-info.x,info.width);
    const height=info.axis==='x'?null:Math.min(4000,Math.max(20,info.height+e.clientY-info.y));
    applyRowResize(info,widths,height,false);
  }
  function endResize(e:ReactPointerEvent<HTMLElement>){drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}

  function selectedWidth(width:number) {
    const info=selected?.group;if(!info)return;
    const percentages=diaryRowPercents(info.keys.map((k,i)=>layout.cellWidths?.[k] || info.weights[i]/info.width*100));
    applyRowResize(info,fitDiaryRow(percentages.map(p=>p*info.width/100),info.index,width,info.width),null);
  }
  function value(key:string,fallback?:DiaryValue):DiaryValue|undefined {
    if(!matching)return undefined;
    if(diaryFormula(key))return fallback;
    if(key in edits)return {value:edits[key],origin:'MANUAL',source:'Unsaved officer edit'};
    return matching.overrides[key] || fallback;
  }
  function field(key:string,data?:DiaryValue,group?:RowResize) {
    const v=value(key,data),auto=v?.origin==='AUTO'&&v.value!=='';
    if(layout.hiddenFields.includes(key))return null;
    return <textarea aria-label={key} data-diary-field={key} title={diaryFormula(key)?'Formula: '+diaryFormula(key):undefined} value={v?.value || ''} readOnly={!!diaryFormula(key)} disabled={!matching || loading || busy}
      rows={1} ref={node=>{if(node){node.style.height='auto';node.style.height=Math.max(node.scrollHeight,layout.fieldSizes[key]?.height || 24)+'px';}}}
      onPointerDown={e=>{const box=e.currentTarget.getBoundingClientRect();resizeStart.current={width:box.width,height:box.height,groupWidth:e.currentTarget.closest('table')?.getBoundingClientRect().width};}}
      onPointerUp={e=>{const start=resizeStart.current;resizeStart.current=null;const box=e.currentTarget.getBoundingClientRect();if(start&&(Math.abs(start.width-box.width)>2 || Math.abs(start.height-box.height)>2)){
        if(group){const width=start.groupWidth || group.width,info={...group,index:group.keys.indexOf(key),cellKey:key,width,weights:group.weights.map(w=>w*width/group.width)};applyRowResize(info,Math.abs(start.width-box.width)>2?fitDiaryRow(info.weights,info.index,box.width+6,width):null,Math.abs(start.height-box.height)>2?Math.min(4000,Math.max(20,box.height+6)):null);}
        else editLayout(old=>({...old,fieldSizes:{...old.fieldSizes,[key]:{width:Math.min(2000,Math.max(20,box.width)),height:Math.min(4000,Math.max(20,box.height))}}}));
      }}}
      onFocus={()=>setSource(v?.source?`${v.source}${v.sourceId?' · '+v.sourceId:''}`:'Editable blank field')}
      onChange={e=>editValue(key,e.target.value)}
      style={{display:'block',width:layout.fieldSizes[key]?.width || '100%',maxWidth:'100%',minWidth:0,minHeight:layout.fieldSizes[key]?.height || 24,height:'auto',padding:'3px',margin:0,font:'inherit',color:'#111827',resize:'both',overflow:'auto',border:auto?'1px solid #16a34a':'1px dotted #cbd5e1',background:auto?'#f0fdf4':'white',boxShadow:auto?'0 0 5px #4ade8099':'none'}} />;
  }
  function renderRow(sheet:DiarySheet,r:DiaryTemplateRow,block?:string,index=0) {
    const rowKey=sheet.name+'!'+(block?block+':'+index:r.row);
    if(layout.hiddenRows.includes(rowKey))return null;
    const headers=sheet.parts.filter(p=>p.kind==='static'&&p.template.cells.filter(c=>c.label&&!c.editable).length>1);
    const header=headers.filter(p=>p.template.row<=r.row).at(-1);
    const nextHeader=headers.find(p=>p.template.row>(header?.template.row || 0));
    const tableParts=header?sheet.parts.filter(p=>p.template.row>=header.template.row&&(!nextHeader||p.template.row<nextHeader.template.row)):[];
    const keys=(cell:typeof r.cells[number])=>block?dataKey(sheet.name,block,index,cell.col):fixedKey(sheet.name,r.row,cell.col);
    const renderCell=(cell:typeof r.cells[number],group?:RowResize)=>{
      const key=block?dataKey(sheet.name,block,index,cell.col):fixedKey(sheet.name,r.row,cell.col);
      const data=block?matching?.blocks[block]?.[index]?.[String(cell.col)]:matching?.fixed[key];
      const label=layout.labels?.[key] ?? cell.label,format=layout.cellFormats?.[key] || {};
      const fontScale=Math.min(1,diaryContentPixels(sheet.columns.length)/sheet.columns.reduce((a,b)=>a+b,0));
      const style:CSSProperties={borderTop:cell.borders.top?'1px solid #475569':'none',borderRight:cell.borders.right?'1px solid #475569':'none',borderBottom:cell.borders.bottom?'1px solid #475569':'none',borderLeft:cell.borders.left?'1px solid #475569':'none',padding:'3px',verticalAlign:cell.vertical==='center'?'middle':'top',fontFamily:`"${cell.fontName}","Nirmala UI",serif`,fontSize:(format.fontSize ?? cell.fontSize*fontScale)+'pt',fontStyle:format.italic?'italic':'normal',fontWeight:(format.bold ?? cell.bold)?700:400,textAlign:format.align || (['center','right','left','justify'].includes(cell.align)?cell.align as CSSProperties['textAlign']:'left'),background:cell.fill || '#fff',color:cell.fontColor,whiteSpace:'pre-wrap',overflowWrap:'break-word',position:'relative',minWidth:0};
      return <td key={cell.col} data-diary-column={cell.col} onDoubleClick={e=>{if(matching && !busy && !loading && !(e.target instanceof HTMLTextAreaElement))setEditingLabel(key);}} colSpan={group?1:cell.span} rowSpan={group?1:cell.rowSpan} style={style} onClick={e=>{const width=e?.currentTarget?.closest('table')?.getBoundingClientRect().width;setSelected({key,sheet:sheet.name,col:cell.col,rowKey,span:cell.span,group:group?{...group,index:group.keys.indexOf(key),cellKey:key,width:width || group.width}:undefined});}}>
        {editingLabel===key?<input data-diary-label aria-label="Edit heading" autoFocus value={label} onChange={e=>editLayout(old=>({...old,labels:{...old.labels,[key]:e.target.value}}))} onBlur={()=>setEditingLabel(null)} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}} style={{width:'100%',maxWidth:'100%',minWidth:0,font:'inherit',boxSizing:'border-box'}} />:
          label && !layout.hiddenFields.includes(key) && <span title="Double-click to edit heading">{label.replace(/2026 \(upto\)/g,`${to?to.slice(0,4):'Current year'} (upto)`).replace(/2025 \(upto\)/g,`${to?Number(to.slice(0,4))-1:'Previous year'} (upto)`).replace(/2025 \(Total\)/g,`${to?Number(to.slice(0,4))-1:'Previous year'} (Total)`)}</span>}

        {(cell.editable || block) && field(key,data,group)}
        {(layout.extraFields[key] || []).map(extra=><div key={extra.id} style={{marginTop:6}}>
          <input data-diary-label aria-label="Added field label" value={extra.label} disabled={!matching || busy || loading} onChange={e=>editLayout(old=>({...old,extraFields:{...old.extraFields,[key]:old.extraFields[key].map(f=>f.id===extra.id?{...f,label:e.target.value}:f)}}))} style={{width:'100%',maxWidth:'100%',minWidth:0,boxSizing:'border-box',font:'inherit',fontWeight:700}} />
          <textarea aria-label={extra.label} value={extra.value} disabled={!matching || busy || loading} rows={1} ref={node=>{if(node){node.style.height='auto';if(node.scrollHeight)node.style.height=node.scrollHeight+'px';}}} onChange={e=>editLayout(old=>({...old,extraFields:{...old.extraFields,[key]:old.extraFields[key].map(f=>f.id===extra.id?{...f,value:e.target.value}:f)}}))} style={{width:'100%',maxWidth:'100%',minWidth:0,boxSizing:'border-box',resize:'vertical',font:'inherit',overflow:'auto'}} />
          <button type="button" className="no-print text-red-700 text-xs" onClick={()=>editLayout(old=>({...old,extraFields:{...old.extraFields,[key]:old.extraFields[key].filter(f=>f.id!==extra.id)}}))}>Remove added field</button>
        </div>)}
        {group && <DiaryResizeHandles info={{...group,index:group.keys.indexOf(key),cellKey:key}} disabled={!matching || loading || busy} start={startResize} move={moveResize} end={endResize} />}
      </td>;
    };
    // Keep vertically merged cells in the parent grid. Each remaining row
    // segment owns a fixed-width inner table, so resizing cannot affect other rows.
    const groups:typeof r.cells[]=[];
    for(const cell of r.cells){const previous=groups[groups.length-1];if(cell.rowSpan>1){groups.push([cell]);}else if(previous&&previous[0].rowSpan===1&&previous[previous.length-1].col+previous[previous.length-1].span===cell.col){previous.push(cell);}else groups.push([cell]);}
    const base=sheet.columns.map((w,c)=> (header&&layout.tableWidths?.[fixedKey(sheet.name,header.template.row,c+1)]) || layout.columnWidths[sheet.name+':'+(c+1)] || w),total=base.reduce((a,b)=>a+b,0);
    return <tr key={block?block+':'+index:'r'+r.row} style={{height:layout.rowHeights[rowKey] || undefined,minHeight:r.height}}>{groups.map(group=>{
      if(group[0].rowSpan>1)return renderCell(group[0]);
      const span=group.reduce((n,c)=>n+c.span,0),weights=group.map(c=>base.slice(c.col-1,c.col-1+c.span).reduce((a,b)=>a+b,0));
      const width=diaryContentPixels(sheet.columns.length)*weights.reduce((a,b)=>a+b,0)/total;
      const fontScale=Math.min(1,diaryContentPixels(sheet.columns.length)/sheet.columns.reduce((a,b)=>a+b,0));
      const minimums=group.map(cell=>Math.max(20,Math.max(0,...cell.label.split(/[\s/]+/).map(w=>w.length))*cell.fontSize*fontScale*96/72*.62+8));
      const defaults=diaryRowPercents(header&&Object.keys(layout.tableWidths || {}).some(k=>k.startsWith(sheet.name+'!'+header.template.row+':'))?weights:fitDiaryRowMinimums(weights,minimums,width));
      const percents=diaryRowPercents(group.map((cell,i)=>layout.cellWidths?.[keys(cell)] || defaults[i]));
      const info:RowResize={keys:group.map(keys),weights:percents.map(p=>p*width/100),width,index:0,rowKey,cellKey:keys(group[0]),height:layout.rowHeights[rowKey] || r.height,
        ...(header?.template.row===r.row&&!block?{table:{sheet:sheet.name,header:r.row,columns:group.map(c=>Array.from({length:c.span},(_,i)=>c.col+i)),rows:tableParts.map(p=>sheet.name+'!'+(p.kind==='data'?p.key+':':p.template.row+':'))}}:{})};
      return <td key={group[0].col} colSpan={span} style={{padding:0,border:0,verticalAlign:'top'}}><table data-diary-row={rowKey} style={{width:'100%',tableLayout:'fixed',borderCollapse:'collapse'}}><colgroup>{percents.map((p,i)=><col key={i} style={{width:p+'%'}} />)}</colgroup><tbody><tr style={{height:layout.rowHeights[rowKey] || undefined}}>{group.map(cell=>renderCell(cell,info))}</tr></tbody></table></td>;
    })}</tr>;
  }

  function rowCount(sheet:string,block:string) {
    const prefix=sheet+'!'+block+':';
    const indexes=matching?Object.keys({...matching.overrides,...edits}).filter(k=>k.startsWith(prefix)).map(k=>Number(k.slice(prefix.length).split(':')[0])+1):[];
    return indexes.reduce((max,n)=>Math.max(max,n),Math.max(1,matching?.blocks[block]?.length || 0,added[block] || 0,layout.extraRows[block] || 0));
  }
  async function save() {
    if(!matching)return;setBusy(true);setError('');
    try {
      const overrides={...Object.fromEntries(Object.entries(matching.overrides).map(([k,v])=>[k,v.value])),...edits};
      const response=await fetch('/api/reports/weekly-diary',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save',from,to,station,revision:matching.revision,overrides,layout})});
      const result=await response.json();if(!response.ok)throw Error(result.error);setPacket(result.packet);setLayout(result.packet.layout || emptyDiaryLayout());setLayoutDirty(false);setEdits({});setSaved('All edited sheets and sizes saved in backend.');
    }catch(e){setError(e instanceof Error?e.message:'Save failed.');}finally{setBusy(false);}
  }
  async function resetCopy() {
    if(!matching || !confirm('Clear all manual values, added fields/rows and layout changes for this diary period? Original backend case data will remain unchanged.'))return;
    setBusy(true);setError('');setErrorKey('');
    try {
      const response=await fetch('/api/reports/weekly-diary',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reset',from,to,station,revision:matching.revision})});
      const result=await response.json();if(!response.ok)throw Error(result.error);
      setPacket(result.packet);setLayout(emptyDiaryLayout());setLayoutDirty(false);setEdits({});setAdded({});setSelected(null);setRefresh(r=>r+1);
    }catch(e){setError(e instanceof Error?e.message:'Reset failed.');}finally{setBusy(false);}
  }
  async function printSheet() {
    const sheet=WEEKLY_TEMPLATE.sheets.find(s=>s.name===active),canvas=document.getElementById('weekly-sheet-'+WEEKLY_TEMPLATE.sheets.findIndex(s=>s.name===active));if(!sheet||!canvas)return;
    setBusy(true);setError('');
    try {
      printFrame.current?.remove();const frame=document.createElement('iframe');printFrame.current=frame;frame.title='Weekly diary print';frame.style.cssText='position:fixed;width:0;height:0;border:0';document.body.appendChild(frame);
      const doc=frame.contentDocument;if(!doc)throw Error('Print preview unavailable.');doc.open();doc.write(weeklyDiaryPrintHtml(canvas,sheet.columns.length));doc.close();await doc.fonts.ready;
      await new Promise<void>(resolve=>setTimeout(resolve,150));frame.contentWindow?.focus();frame.contentWindow?.print();
    }catch(e){setError(e instanceof Error?e.message:'Print failed.');}finally{setBusy(false);}
  }
  function exportCsv() {
    const el=document.getElementById('weekly-sheet-'+WEEKLY_TEMPLATE.sheets.findIndex(s=>s.name===active));if(!el)return;
    const table=el.querySelector('table');if(!table)return;
    const rows=Array.from(table.rows).map(tr=>Array.from(tr.cells).flatMap(td=>{const nested=td.querySelector('table');return nested?.rows[0]?Array.from(nested.rows[0].cells):[td];}).map(td=>{
      const controls=Array.from(td.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea')).map(c=>c.value).filter(v=>v!=='');
      const copy=td.cloneNode(true) as HTMLElement;copy.querySelectorAll('input,textarea,button,.no-print,[data-no-print]').forEach(c=>c.remove());
      let text=controls.length?controls.join('\n'):copy.textContent || '';if(/^[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';
    }).join(','));
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`Weekly_${active.trim()}_${from}_${to}.csv`;a.click();URL.revokeObjectURL(url);
  }
  return <div className="space-y-3">
    <div className="no-print bg-white border p-3 space-y-2 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <label>Police Station <select aria-label="Weekly diary police station" disabled={busy} value={station} onChange={e=>changePeriod(setStation,e.target.value)} className="border p-2"><option value="">Select station</option>{[...new Set([station,...stations].filter(Boolean))].map(s=><option key={s}>{s}</option>)}</select></label>
        <label>From <input aria-label="Weekly diary from" type="date" max={today} disabled={busy} value={from} onChange={e=>{if(e.target.value>today){setError('Future dates are not allowed.');return;}changePeriod(setFrom,e.target.value);}} className="border p-2" /></label>
        <label>To <input aria-label="Weekly diary to" type="date" min={from || undefined} max={today} disabled={busy} value={to} onChange={e=>{if(e.target.value>today){setError('Future dates are not allowed.');return;}changePeriod(setTo,e.target.value);}} className="border p-2" /></label>
        <button disabled={!valid || busy || loading} onClick={()=>{if((!Object.keys(edits).length&&!layoutDirty)||confirm('Reload backend data without unsaved edits?'))setRefresh(r=>r+1);}} className="border px-3 py-2">Refresh Autofill</button>
        <button disabled={!matching || loading || busy} onClick={save} className="bg-blue-900 text-white px-3 py-2">Save All Sheets</button>
        <button disabled={!matching || loading || busy || !history.length} onClick={()=>undoEdit()} className="border px-3 py-2">Undo</button><button disabled={!matching || loading || busy || !redo.length} onClick={()=>undoEdit(true)} className="border px-3 py-2">Redo</button>
        <button disabled={busy || loading} onClick={printSheet} className="border px-3 py-2">Print Sheet</button>
        <button onClick={exportCsv} className="border px-3 py-2">Export CSV</button>
      </div>
      <p className="text-emerald-700">22 blank Excel-format templates · Select From–To to autofill · Green glow = backend data · Edit cells directly · Double-click headings to edit · Tab/Enter to move · Paste cells from Excel.</p>
      {!from || !to?<p>Select both dates to load data.</p>:!valid?<p role="alert" className="text-red-700">Select dates up to today, with From on or before To.</p>:null}
      {loading&&<p role="status">Loading processed backend data…</p>}{error&&<p role="alert" className="text-red-700">{error}</p>}{saved&&matching&&<p role="status">{saved}</p>}
      <details><summary className="cursor-pointer">Data status &amp; source</summary>{matching?.warnings.map(w=><p key={w} className="text-amber-800">{w}</p>)}{source&&<p className="break-words">{source}</p>}</details>
    </div>
    <nav aria-label="Weekly crime diary sheets" className="no-print flex flex-wrap gap-1 border bg-white p-2">{WEEKLY_TEMPLATE.sheets.map((sheet,i)=><button key={sheet.name} aria-pressed={sheet.name===active} onClick={()=>{setActive(sheet.name);setSelected(null);setSource('');}} className={`max-w-full whitespace-normal break-words px-3 py-2 text-xs border ${sheet.name===active?'bg-blue-900 text-white':'bg-white text-blue-900'}`}>{i+1}. {sheet.name.trim()}</button>)}</nav>
    <details className="no-print border bg-white p-2 text-xs"><summary className="cursor-pointer font-semibold">Cell Format</summary><div className="flex flex-wrap items-center gap-2 pt-2">
      <span>Click a cell to adjust its size or add/remove a field.</span>
      {selected && <>
        <button disabled={!matching || busy || loading} aria-pressed={!!layout.cellFormats?.[selected.key]?.bold} className="border px-2 py-1 font-bold" onClick={()=>editLayout(old=>({...old,cellFormats:{...old.cellFormats,[selected.key]:{...old.cellFormats?.[selected.key],bold:!old.cellFormats?.[selected.key]?.bold}}}))}>Bold</button>
        <button disabled={!matching || busy || loading} aria-pressed={!!layout.cellFormats?.[selected.key]?.italic} className="border px-2 py-1 italic" onClick={()=>editLayout(old=>({...old,cellFormats:{...old.cellFormats,[selected.key]:{...old.cellFormats?.[selected.key],italic:!old.cellFormats?.[selected.key]?.italic}}}))}>Italic</button>
        <label>Align <select aria-label="Cell alignment" disabled={!matching || busy || loading} value={layout.cellFormats?.[selected.key]?.align || 'left'} onChange={e=>{const align=e.target.value as 'left'|'center'|'right';editLayout(old=>({...old,cellFormats:{...old.cellFormats,[selected.key]:{...old.cellFormats?.[selected.key],align}}}));}} className="border p-1"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
        <label>Font size <input aria-label="Cell font size" type="number" min={6} max={36} disabled={!matching || busy || loading} value={layout.cellFormats?.[selected.key]?.fontSize || 12} onChange={e=>{const fontSize=Number(e.target.value);if(fontSize>=6&&fontSize<=36)editLayout(old=>({...old,cellFormats:{...old.cellFormats,[selected.key]:{...old.cellFormats?.[selected.key],fontSize}}}));}} className="border w-16 p-1" /></label>
        <label>{selected.group?.table?'Column width · whole table':'Cell width · this row'} <input aria-label="Column width" type="number" min={20} max={Math.round(selected.group?.width || 2000)} disabled={!matching || busy || loading || !selected.group} value={Math.round(selected.group?((layout.cellWidths?.[selected.key] || selected.group.weights[selected.group.index]/selected.group.width*100)*selected.group.width/100):200)} onChange={e=>{const n=Number(e.target.value);if(n>=20)selectedWidth(n);}} className="border w-20 p-1" /></label>
        <label>Row height <input aria-label="Row height" type="number" min={20} max={4000} disabled={!matching || busy || loading} value={layout.rowHeights[selected.rowKey] || 24} onChange={e=>{const n=Number(e.target.value);if(n>=20&&n<=4000)editLayout(old=>({...old,rowHeights:{...old.rowHeights,[selected.rowKey]:n}}));}} className="border w-20 p-1" /></label>
        <label>Field height <input aria-label="Field height" type="number" min={20} max={4000} disabled={!matching || busy || loading} value={Math.round(layout.fieldSizes[selected.key]?.height || 24)} onChange={e=>{const n=Number(e.target.value);if(n>=20&&n<=4000)editLayout(old=>({...old,fieldSizes:{...old.fieldSizes,[selected.key]:{width:old.fieldSizes[selected.key]?.width || 200,height:n}}}));}} className="border w-20 p-1" /></label>
        <button disabled={!matching || busy || loading} className="border px-2 py-1" onClick={()=>{const label=prompt('Name of new field','New field');if(label)editLayout(old=>({...old,extraFields:{...old.extraFields,[selected.key]:[...(old.extraFields[selected.key] || []),{id:crypto.randomUUID(),label,value:''}]}}));}}>+ Add Field</button>
        <button disabled={!matching || busy || loading} className="border px-2 py-1 text-red-700" onClick={()=>editLayout(old=>({...old,hiddenFields:[...new Set([...old.hiddenFields,selected.key])]}))}>Remove Field</button>
        <button disabled={!matching || busy || loading} className="border px-2 py-1 text-red-700" onClick={()=>{if(confirm('Remove this row from this diary template?'))editLayout(old=>({...old,hiddenRows:[...new Set([...old.hiddenRows,selected.rowKey])]}));}}>Delete Row</button>
      </>}
      <button disabled={!matching || busy || loading} className="border px-2 py-1" onClick={()=>{if(confirm('Restore original Excel layout? Field values will be kept; added fields and size adjustments will be reset.')){editLayout(()=>emptyDiaryLayout());setAdded({});}}}>Reset Layout</button>
      <button disabled={!matching || loading || busy} onClick={resetCopy} className="border px-2 py-1">Reset Diary Copy</button>
    </div></details>
    {(layoutDirty || Object.keys(edits).length>0)&&<p className="no-print text-xs font-semibold">Unsaved edits — Save All Sheets</p>}
    {WEEKLY_TEMPLATE.sheets.filter(sheet=>sheet.name===active).map(sheet=><section key={sheet.name} style={{display:active===sheet.name?'block':'none'}}>
      <div className="overflow-x-auto border bg-slate-100 p-3"><div id={'weekly-sheet-'+WEEKLY_TEMPLATE.sheets.findIndex(s=>s.name===sheet.name)} className="a4-sheet bg-white text-black mx-auto" onKeyDown={gridKeys} onPaste={pasteCells} style={{width:diaryLandscape(sheet.columns.length)?'297mm':'210mm',boxSizing:'border-box',padding:'10mm',fontFamily:'Arial,"Nirmala UI",sans-serif',fontSize:12}}>
        <h2 className="no-print" style={{fontSize:18,fontWeight:700,marginBottom:12}}>{sheet.name.trim()} · A4 {diaryLandscape(sheet.columns.length)?'Landscape':'Portrait'}</h2>
        <p className="no-print" style={{marginBottom:12}}>{matching?`${station} · ${from} TO ${to}`:''}</p>
        <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}><colgroup>{sheet.columns.map((w,c)=><col key={c} style={{width:((layout.columnWidths[sheet.name+':'+(c+1)] || w)/sheet.columns.reduce((sum,v,i)=>sum+(layout.columnWidths[sheet.name+':'+(i+1)] || v),0)*100)+'%'}} />)}</colgroup><tbody>
          {sheet.parts.flatMap(part=>part.kind==='static'?[renderRow(sheet,part.template)]:Array.from({length:rowCount(sheet.name,part.key!)},(_,r)=>renderRow(sheet,part.template,part.key,r)))}
          {(layout.customRows?.[sheet.name] || []).map(row=>{
            const width=diaryContentPixels(sheet.columns.length),percentages=diaryRowPercents(row.cells.map(c=>c.width));
            const info:RowResize={keys:row.cells.map((_,i)=>sheet.name+'!custom:'+row.id+':'+i),weights:percentages.map(p=>p*width/100),width,index:0,rowKey:sheet.name+'!custom:'+row.id,cellKey:'',height:24,custom:{sheet:sheet.name,id:row.id}};
            return <tr key={row.id}><td colSpan={sheet.columns.length} style={{padding:0,border:0}}><table style={{width:'100%',tableLayout:'fixed',borderCollapse:'collapse'}}><colgroup>{percentages.map((p,i)=><col key={i} style={{width:p+'%'}} />)}</colgroup><tbody><tr>{row.cells.map((cell,col)=><td key={col} data-diary-column={col+1} style={{border:'1px solid #475569',padding:3,verticalAlign:'top',position:'relative',overflowWrap:'anywhere'}}>
              <textarea aria-label={`Added row ${col+1}`} rows={1} value={cell.value} disabled={!matching || busy || loading} style={{width:'100%',maxWidth:'100%',minWidth:0,boxSizing:'border-box',minHeight:cell.height,font:'inherit',resize:'vertical',overflow:'auto'}} ref={node=>{if(node){node.style.height='auto';node.style.height=Math.max(node.scrollHeight,cell.height)+'px';}}}
                onChange={e=>editLayout(old=>({...old,customRows:{...old.customRows,[sheet.name]:old.customRows[sheet.name].map(r=>r.id===row.id?{...r,cells:r.cells.map((c,i)=>i===col?{...c,value:e.target.value}:c)}:r)}}))} />
              {col===0&&<button type="button" className="no-print text-xs text-red-700" onClick={()=>editLayout(old=>({...old,customRows:{...old.customRows,[sheet.name]:old.customRows[sheet.name].filter(r=>r.id!==row.id)}}))}>Delete added row</button>}
              {<DiaryResizeHandles info={{...info,index:col,cellKey:info.keys[col],height:cell.height}} disabled={!matching || loading || busy} start={startResize} move={moveResize} end={endResize} />}
            </td>)}</tr></tbody></table></td></tr>;
          })}
        </tbody></table>
      </div></div>
      <div className="no-print flex flex-wrap gap-2 mt-2">{sheet.parts.filter(p=>p.kind==='data').map((part,index)=><button key={part.key} disabled={!matching || busy || loading} onClick={()=>{const count=rowCount(sheet.name,part.key!)+1;setAdded(old=>({...old,[part.key!]:count}));editLayout(old=>({...old,extraRows:{...old.extraRows,[part.key!]:count}}));}} className="border px-2 py-1 text-xs">+ Add Row · Table {index+1}</button>)}
        <button type="button" disabled={!matching || busy || loading} onClick={()=>editLayout(old=>({...old,customRows:{...old.customRows,[sheet.name]:[...(old.customRows?.[sheet.name] || []),{id:crypto.randomUUID(),cells:sheet.columns.map(w=>({value:'',width:Math.max(20,w-6),height:24}))}]}}))} className="border px-2 py-1 text-xs">+ Add Blank Row</button>
      </div>
    </section>)}
  </div>;
}
