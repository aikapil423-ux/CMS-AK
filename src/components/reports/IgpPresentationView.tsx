"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { diaryToday, validDiaryPeriod } from '@/lib/weeklyDiary';
import { igpSlides, igpCellKey, type IgpBriefing, type IgpTable } from '@/lib/igpTemplate';
import { ReportsService } from '@/services/reportsService';
import { printA4Element } from '@/utils/printElement';

const slideWidth = 9144000;
const percent = (value:number) => (value / slideWidth * 100) + '%';
const slideUnit = (value:number) => (value / slideWidth * 100) + 'cqw';
const displayDate = (date:string) => date.split('-').reverse().join('.');
const tableBorder = '1px solid #4b5563';

function periodLabel(label: string, briefing: IgpBriefing, slide: number) {
  const year = Number(briefing.cutoff.slice(0,4));
  const [month,day] = briefing.cutoff.slice(5).split('-').map(Number);
  const priorDay = Math.min(day,new Date(Date.UTC(year-1,month,0)).getUTCDate());
  const prior = [year-1,String(month).padStart(2,'0'),String(priorDay).padStart(2,'0')].join('-');
  const tokens:Record<string,string> = {
    '2023':String(year-3),'2024':String(year-2),'2025':String(year-1),'2026':String(year),
  };
  return label.replace(/Snapshot - 2 years for Panipat/i,'Snapshot - 2 years for '+briefing.district)
    .replace(/\b\d{2}\.\d{2}\.\d{2,4}\b|\b202[3-6]\b/g,token=>{
      if(tokens[token]) return tokens[token];
      if(token.startsWith('01.01.')) return '01.01.'+(token.endsWith('2025')?year-1:token.endsWith('2024')?year-2:year);
      if(token.endsWith('2025') || token.endsWith('.25'))return displayDate(prior);
      if(slide===20 && token.startsWith('05.08.'))return 'period start not available';
      return displayDate(briefing.cutoff);
    });
}

type SlideEdits = Record<string,string>;
type EditField = (key:string,value:string)=>void;

function EditableText({label,value,placeholder,auto,onChange}:{
  label:string; value:string; placeholder?:string; auto?:boolean; onChange:(value:string)=>void;
}) {
  return <div data-igp-autofill={auto || undefined} title={auto?'Filled from scoped CMS records':undefined}
    style={auto?{background:'#dcfce7',color:'#14532d',boxShadow:'0 0 5px #4ade80',borderRadius:2}:undefined}>
    <textarea aria-label={label} rows={1} value={value} placeholder={placeholder}
      onChange={event=>onChange(event.target.value)}
      className="focus-visible:outline-2 focus-visible:outline-blue-700"
      style={{display:'block',width:'100%',minHeight:'1.15em',fieldSizing:'content',resize:'none',
        padding:0,border:0,background:'transparent',font:'inherit',textAlign:'inherit',color:'inherit',lineHeight:'inherit'}} />
  </div>;
}

function SlideTable({shape, briefing, slide, table, marginTop, edits, edit}:{
  shape:IgpTable; briefing:IgpBriefing; slide:number; table:number; marginTop:number; edits:SlideEdits; edit:EditField;
}) {
  const total = shape.columns.reduce((sum,col)=>sum+col,0);
  function field(key:string, row:number, column:number, value:string|number|undefined, auto:boolean) {
    const label='Slide '+slide+', table '+(table+1)+', row '+(row+1)+', column '+(column+1);
    return <EditableText label={label} value={edits[key] ?? String(value ?? '')} placeholder="—"
      auto={auto && value!==undefined && !(key in edits)} onChange={text=>edit(key,text)} />;
  }
  return <table aria-label={'Slide '+slide+' table '+(table+1)}
    style={{marginTop:slideUnit(marginTop),marginLeft:percent(shape.box[0]),width:percent(shape.box[2]),
      borderCollapse:'collapse',tableLayout:'fixed'}}>
    <colgroup>{shape.columns.map((column,index)=><col key={index} style={{width:column/total*100+'%'}} />)}</colgroup>
    <tbody>
      {shape.rows.map((row,r)=><Fragment key={r}><tr>
        {row.map(cell=>{
          const style:CSSProperties = {
            border:tableBorder, padding:'0.11em 0.26em', verticalAlign:'middle',
            backgroundColor:cell.fill?'#'+cell.fill:slide===25?(r===0 || cell.c===0?'#4f81bd':r%2?'#d0d8e8':'#e9edf4'):undefined,
            color:slide===25 && (r===0 || cell.c===0)?'#fff':undefined, whiteSpace:'pre-wrap',
            textAlign:cell.align==='l'?'left':cell.align==='r'?'right':'center',
            fontSize: 'max(8px, '+(cell.size || 1150)/720+'cqw)', lineHeight:1.15,
            overflowWrap:'anywhere', fontWeight:cell.colSpan>1?700:400,
          };
          const key=igpCellKey(slide,table,r,cell.c);
          const value=cell.field?briefing.values[key]:periodLabel(cell.text,briefing,slide);
          return <td key={cell.c} colSpan={cell.colSpan} rowSpan={cell.rowSpan} style={style}>
            {field(key,r,cell.c,value,cell.field)}
          </td>;
        })}
      </tr>
      {(briefing.caseOverflow[[slide,table,r].join(':')] || []).map((entry,i)=><tr key={i}>
        {entry.map((value,c)=><td key={c} style={{border:tableBorder,padding:'0.24em',fontSize:'max(9px, 1.6cqw)',overflowWrap:'anywhere'}}>
          {field([slide,table,r,'extra',i,c].join(':'),r+i+1,c,value===''?undefined:value,true)}
        </td>)}
      </tr>)}
      </Fragment>)}
    </tbody>
  </table>;
}

function BriefingSlide({index, briefing, edits, edit, today}:{
  index:number; briefing:IgpBriefing; edits:SlideEdits; edit:EditField; today:string;
}) {
  const slide=index+1;
  const shapes=[...igpSlides[index]].sort((a,b)=>a.box[1]-b.box[1]);
  const style:CSSProperties={
    width:'100%', minHeight:'75cqw', paddingBottom:'1.5cqw', boxSizing:'border-box',
    background:'#fff', color:'#111827', fontFamily:'Times New Roman, Nirmala UI, serif',
    breakAfter:'page',
  };
  return <div className="border border-slate-300 bg-white shadow-sm" style={{containerType:'inline-size',minWidth:690}}>
    <article aria-label={'Slide '+slide} style={style}>
      {shapes.map((shape,i)=>{
        const [left,top,width,height]=shape.box;
        const precedingBottom=Math.max(0,...shapes.slice(0,i).map(item=>item.box[1]+item.box[3]));
        const gap=Math.max(0,top-precedingBottom);
        if(shape.kind==='table')return <SlideTable key={i} shape={shape} briefing={briefing} slide={slide}
          table={igpSlides[index].filter(item=>item.kind==='table').indexOf(shape)} marginTop={gap} edits={edits} edit={edit} />;
        if(shape.kind==='logo')return <div key={i} style={{paddingTop:slideUnit(gap),marginLeft:percent(left),width:percent(width)}}>
          <Image src="/igp-panipat-police.jpg" width={400} height={400} alt="Haryana Police emblem"
            priority={index===0} style={{display:'block',width:'100%',height:slideUnit(height),objectFit:'contain'}} />
        </div>;
        const coverDetails=slide===1 && shape.text.startsWith('A meeting');
        const isCoverTitle=slide===1 && !coverDetails;
        const titleKey='heading:'+slide+':'+i;
        const title=isCoverTitle
          ? (briefing.district?briefing.district.toUpperCase()+' POLICE':'')
          : coverDetails?'Crime, Law & Order and Administrative Issues':periodLabel(shape.text,briefing,slide);
        const coverBackground=isCoverTitle?'linear-gradient(#7654a4, #573a7c)':coverDetails?'linear-gradient(#fa913b, #b86b24)':undefined;
        return <div key={i} style={{marginTop:slideUnit(gap),marginLeft:percent(left),width:percent(width),
          minHeight:slideUnit(height),boxSizing:'content-box',display:'grid',alignContent:'center',textAlign:'center',
          background:coverBackground,borderRadius:coverBackground?'1.6cqw':undefined,color:isCoverTitle?'white':undefined,
          fontWeight:700,fontSize:'max(14px, '+(shape.size || 2400)/720+'cqw)',lineHeight:1.12,whiteSpace:'pre-wrap'}}>
          <EditableText label={isCoverTitle?'District name on IGP cover':'Slide '+slide+' heading'}
            value={edits[titleKey] ?? title} placeholder={isCoverTitle?'DISTRICT POLICE':undefined}
            onChange={value=>edit(titleKey,value)} />
          {coverDetails && <div style={{fontSize:'0.55em',marginTop:'0.6em',display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'0.65em'}}>
            <span>Report cutoff: {displayDate(briefing.cutoff)}</span>
            <label>Meeting date <input type="date" max={today} value={edits.meetingDate || ''}
              onChange={e=>{if(e.target.value<=today)edit('meetingDate',e.target.value);}} /></label>
            <label>Time <input type="time" value={edits.meetingTime || ''} onChange={e=>edit('meetingTime',e.target.value)} /></label>
            <label>Venue <input type="text" placeholder="—" value={edits.meetingVenue || ''}
              style={{width:'9em'}} onChange={e=>edit('meetingVenue',e.target.value)} /></label>
          </div>}
        </div>;
      })}
    </article>
  </div>;
}

export function IgpPresentationView({data}:{data:IgpBriefing}) {
  const [briefing,setBriefing]=useState(data);
  const [drafts,setDrafts]=useState<Record<string,SlideEdits>>({});
  const [cutoff,setCutoff]=useState(data.cutoff);
  const [slide,setSlide]=useState(0);
  const [full,setFull]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const request=useRef<AbortController|null>(null);
  const today=diaryToday();
  const valid=validDiaryPeriod(cutoff,cutoff,today);
  useEffect(()=>()=>request.current?.abort(),[]);
  async function refresh() {
    if(!valid)return;
    request.current?.abort();
    const controller=new AbortController();
    request.current=controller;
    setLoading(true);
    setError('');
    try {
      const result=await ReportsService.getIgpPresentationData(cutoff,controller.signal);
      if(!controller.signal.aborted)setBriefing(result);
    } catch(err) {
      if(!controller.signal.aborted)setError(err instanceof Error?err.message:'IGP briefing could not be loaded.');
    } finally {
      if(!controller.signal.aborted)setLoading(false);
    }
  }
  const ready=cutoff===briefing.cutoff && !loading;
  const draftKey=briefing.district+'|'+briefing.cutoff;
  const edits=drafts[draftKey] || {};
  const edit:EditField=(key,value)=>setDrafts(previous=>({
    ...previous,[draftKey]:{...previous[draftKey],[key]:value},
  }));
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2 border bg-white p-3 text-xs print:hidden">
      <button type="button" aria-pressed={!full} className="border px-3 py-2" onClick={()=>setFull(false)}>Interactive Slides</button>
      <button type="button" aria-pressed={full} className="border px-3 py-2" onClick={()=>setFull(true)}>Full Briefing Document</button>
      {!full && <div className="flex items-center gap-2">
        <button type="button" aria-label="Previous slide" className="border p-1" disabled={slide===0} onClick={()=>setSlide(slide-1)}><ChevronLeft size={16}/></button>
        <label className="flex items-center gap-1">Slide <select aria-label="Select slide" value={slide} onChange={e=>setSlide(Number(e.target.value))} className="border p-1">
          {igpSlides.map((_,index)=><option key={index} value={index}>{index+1} / {igpSlides.length}</option>)}
        </select></label>
        <button type="button" aria-label="Next slide" className="border p-1" disabled={slide===igpSlides.length-1} onClick={()=>setSlide(slide+1)}><ChevronRight size={16}/></button>
      </div>}
      <label className="flex items-center gap-2">Report cutoff <input type="date" aria-label="IGP report cutoff" value={cutoff} max={today}
        className="border p-1.5" onChange={e=>{if(e.target.value>today){setError('Future dates are not allowed.');return;}setCutoff(e.target.value);setError('');}} /></label>
      <button type="button" className="border px-3 py-2" disabled={!valid || loading} onClick={()=>void refresh()}>{loading?'Loading…':'Refresh Autofill'}</button>
      <button type="button" className="ml-auto flex items-center gap-2 bg-blue-900 px-3 py-2 text-white disabled:opacity-50" disabled={!ready}
        onClick={()=>printA4Element('printable-igp-presentation','IGP_MEETING_'+briefing.district+'_'+briefing.cutoff)}>
        <Printer size={15}/> {full?'Print Full Briefing':'Print Slide'}
      </button>
    </div>
    {error && <p role="alert" className="border border-red-300 bg-red-50 p-2 text-sm text-red-900">{error}</p>}
    {!ready && !loading && <p role="status" className="text-sm">Select a cutoff up to today and click Refresh Autofill.</p>}
    <p className="text-xs text-slate-700">Click any field to edit. <span className="rounded bg-green-100 px-1 text-green-900">Green glow</span> marks values filled from CMS records. A dash means no verified value is available for this cutoff.</p>
    {ready && <div className="overflow-x-auto">
      <div id="printable-igp-presentation" className="mx-auto grid max-w-5xl gap-4">
        {full?igpSlides.map((_,index)=><BriefingSlide key={index} index={index} briefing={briefing} edits={edits} edit={edit} today={today} />)
          :<BriefingSlide index={slide} briefing={briefing} edits={edits} edit={edit} today={today} />}
      </div>
    </div>}
  </div>;
}
