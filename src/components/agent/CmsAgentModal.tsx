"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mic, Send, Paperclip, Loader2, Maximize2, Minimize2, Volume2, Square, RotateCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { WebsiteOperatorSession } from '@/services/agent/websiteOperatorSession';
import { newExperience, type OperatorExperience } from '@/services/agent/operatorExperience';
import { readOperatorAttachment } from '@/services/agent/operatorAttachment';

type Message={id:string;sender:'user'|'agent';text:string;feedback?:boolean};
interface CmsAgentModalProps {isOpen:boolean;onClose:()=>void;anchorPosition:{x:number;y:number}}
const welcome:Message={id:'welcome',sender:'agent',text:'जय हिन्द! Kaam Hindi, English ya Hinglish mein batayein. Main current page, selected case aur aapki di hui details use karunga. Missing facts poochunga; final save/send se pehle review hoga. Example: “acts sections kholo then search Arms”.'};

export function CmsAgentModal({isOpen,onClose}:CmsAgentModalProps){
  const router=useRouter();const {currentUser,isAuthenticated}=useAuth();
  const [messages,setMessages]=useState<Message[]>([welcome]);
  const [input,setInput]=useState('');const [loading,setLoading]=useState(false);
  const [expanded,setExpanded]=useState(false);const [listening,setListening]=useState(false);
  const [lang,setLang]=useState('hi-IN');const [spoken,setSpoken]=useState(false);
  const [experience,setExperience]=useState<OperatorExperience>(newExperience);
  const [files,setFiles]=useState<{name:string;summary:string;preview:string;uncertainties:string[]}[]>([]);
  const [error,setError]=useState('');
  const sessionRef=useRef<WebsiteOperatorSession|null>(null);
  const recognitionRef=useRef<any>(null);const uploadRef=useRef<HTMLInputElement>(null);const endRef=useRef<HTMLDivElement>(null);
  const spokenRef=useRef(spoken);spokenRef.current=spoken;
  const append=(text:string)=>setMessages(prev=>[...prev,{id:crypto.randomUUID(),sender:'agent',text}]);
  useEffect(()=>{
    const session=new WebsiteOperatorSession(setExperience);sessionRef.current=session;setExperience(newExperience());setMessages([welcome]);setFiles([]);setInput('');
    return ()=>{session.clear();if(sessionRef.current===session)sessionRef.current=null;};
  },[currentUser.id,isAuthenticated]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[messages,experience.phase]);
  useEffect(()=>{
    const Recognition=(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if(!Recognition)return;
    const recognition=new Recognition();recognition.lang=lang;recognition.continuous=false;recognition.interimResults=true;
    recognition.onstart=()=>setListening(true);recognition.onend=()=>setListening(false);
    recognition.onerror=(event:any)=>{setListening(false);setError(`Voice input: ${event.error}. Text se command de sakte hain.`);};
    recognition.onresult=(event:any)=>{
      let transcript='';for(let i=event.resultIndex;i<event.results.length;i++)transcript+=event.results[i][0].transcript;
      if(/^(stop|ruko|रुको)$/i.test(transcript.trim())){sessionRef.current?.stop();window.speechSynthesis?.cancel();return;}
      setInput(transcript); // User can correct names/numbers before sending.
    };
    recognitionRef.current=recognition;
    return ()=>{recognition.onresult=null;recognition.onend=null;recognition.onerror=null;recognition.abort();recognitionRef.current=null;};
  },[lang]);
  useEffect(()=>{if(!isOpen){recognitionRef.current?.abort();window.speechSynthesis?.cancel();}},[isOpen]);
  useEffect(()=>()=>window.speechSynthesis?.cancel(),[]);
  async function send(text=input){
    if(!text.trim()||loading)return;
    if(!isAuthenticated){setError('Pehle sign in karein.');return;}
    const session=sessionRef.current;if(!session)return;
    setMessages(prev=>[...prev,{id:crypto.randomUUID(),sender:'user',text}]);setInput('');setLoading(true);setError('');
    try{
      const answer=await session.run(text,path=>router.push(path));
      if(sessionRef.current!==session)return;
      append(answer);
      if(spokenRef.current && 'speechSynthesis' in window){window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(answer);speech.lang=lang;window.speechSynthesis.speak(speech);}
    }catch(e){setError(e instanceof Error?e.message:'Command failed');}finally{setLoading(false);}
  }
  async function upload(event:React.ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];event.target.value='';if(!file||loading)return;
    const session=sessionRef.current;setLoading(true);setError('');
    try{
      const result=await readOperatorAttachment(file);if(!session||session!==sessionRef.current)return;
      session.addAttachment(file.name,result.text);
      setFiles(prev=>[...prev,{name:file.name,summary:result.summary,preview:result.text,uncertainties:result.uncertainties}].slice(-3));
      append(`${file.name}: ${result.summary} Extracted facts/source preview dekhkar batayein kya karna hai. Unclear details guess nahi ki jayengi.`);
    }catch(e){setError(e instanceof Error?e.message:'Attachment failed');}finally{setLoading(false);}
  }
  function stop(){sessionRef.current?.stop();recognitionRef.current?.abort();window.speechSynthesis?.cancel();}
  function reset(){stop();const session=new WebsiteOperatorSession(setExperience);sessionRef.current=session;setExperience(newExperience());setMessages([welcome]);setFiles([]);setInput('');setError('');}
  function exportReport(){const data=sessionRef.current?.report();const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='cms-agent-quality-report.json';a.click();URL.revokeObjectURL(url);}
  if(!isOpen)return null;
  return <section data-cms-agent-ui aria-label="CMS AI workspace" className={`fixed z-50 flex flex-col bg-white border border-slate-300 shadow-2xl rounded-2xl overflow-hidden ${expanded?'inset-4 sm:inset-8 max-w-6xl mx-auto':'right-4 bottom-4 w-[94vw] sm:w-[500px] h-[85vh] max-h-[820px]'}`}>
    <header className="bg-slate-950 text-white p-3 flex items-center justify-between gap-2">
      <div><h2 className="font-bold text-sm">CMS AI Agent</h2><p className="text-[10px] text-slate-300">{currentUser.stationName} · {experience.phase}</p></div>
      <div className="flex gap-2">
        <button type="button" aria-label={spoken?'Disable spoken replies':'Enable spoken replies'} aria-pressed={spoken} onClick={()=>{setSpoken(!spoken);window.speechSynthesis?.cancel();}}><Volume2 size={17}/></button>
        <button type="button" aria-label="New task" disabled={loading} onClick={reset}><RotateCcw size={17}/></button>
        <button type="button" aria-label={expanded?'Minimize workspace':'Expand workspace'} onClick={()=>setExpanded(!expanded)}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button>
        <button type="button" aria-label="Close agent" onClick={onClose}><X size={18}/></button>
      </div>
    </header>
    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
      {experience.objective && <details className="bg-white border rounded-lg p-2 text-xs" open={loading}>
        <summary className="font-semibold">Current task · {experience.phase}</summary><p className="mt-2 whitespace-pre-wrap">{experience.objective}</p>
        <ol className="list-decimal pl-5 mt-2">{experience.steps.map((step,i)=><li key={i}>{step}</li>)}</ol>
      </details>}
      {files.map((file,i)=><details key={`${file.name}-${i}`} className="border rounded-lg p-2 text-xs bg-white"><summary>Source: {file.name}</summary><p>{file.summary}</p>{file.uncertainties.length>0&&<p className="text-amber-800">Verify: {file.uncertainties.join('; ')}</p>}<pre className="whitespace-pre-wrap max-h-52 overflow-auto mt-2">{file.preview.split('\n').map((line,n)=>`L${n+1}: ${line}`).join('\n')}</pre></details>)}
      {messages.map(message=><article key={message.id} className={`text-xs p-3 rounded-xl whitespace-pre-wrap ${message.sender==='user'?'bg-blue-100 ml-8':'bg-white border mr-3'}`}>
        {message.text}
        {message.sender==='agent'&&message.id!=='welcome'&&<div className="flex gap-3 mt-2 text-[10px] text-slate-500">
          {[true,false].map(helpful=><button key={String(helpful)} disabled={message.feedback!==undefined} onClick={()=>{sessionRef.current?.feedback(helpful);setMessages(prev=>prev.map(m=>m.id===message.id?{...m,feedback:helpful}:m));}}>{helpful?'Helpful':'Needs improvement'}</button>)}
        </div>}
      </article>)}
      {experience.choices.length>0&&<div className="grid gap-2">{experience.choices.map((choice,i)=><button key={i} disabled={loading} className="text-left border rounded-lg p-2 text-xs bg-blue-50" onClick={()=>send(`choose ${i+1}`)}>{choice}</button>)}</div>}
      {experience.review.length>0&&<div className="border border-amber-300 bg-amber-50 rounded-lg p-3 text-xs"><strong>Review proposed changes</strong><table className="w-full mt-2"><thead><tr><th className="text-left">Field</th><th className="text-left">Current</th><th className="text-left">Proposed</th></tr></thead><tbody>{experience.review.map((r,i)=><tr key={i}><td className="align-top p-1">{r.label}</td><td className="align-top p-1 break-all">{r.before||'—'}</td><td className="align-top p-1 break-all">{r.after}</td></tr>)}</tbody></table></div>}
      {(experience.phase==='review')&&<div className="flex gap-2"><button disabled={loading} className="bg-blue-700 text-white px-3 py-2 rounded text-xs" onClick={()=>send('हाँ')}>Confirm</button><button className="border px-3 py-2 rounded text-xs" onClick={stop}>Cancel</button></div>}
      {loading&&<p role="status" className="text-xs flex gap-2"><Loader2 size={15} className="animate-spin"/>Command process ho rahi hai…</p>}
      {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
      <div ref={endRef}/>
    </div>
    <footer className="p-3 border-t space-y-2">
      <div className="flex justify-between text-[10px] text-slate-600"><span>{experience.metrics.verifiedSteps} verified steps · {experience.metrics.failures} errors</span><button onClick={exportReport}>Export quality report</button></div>
      <div className="flex gap-2 text-xs"><button disabled={loading} onClick={()=>send('undo')}>Undo last field</button><button disabled={loading} onClick={()=>send('retry')}>Retry / resume</button><select aria-label="Voice language" value={lang} onChange={e=>setLang(e.target.value)}><option value="hi-IN">Hindi / Hinglish</option><option value="en-IN">English</option></select></div>
      <form className="flex items-center gap-2" onSubmit={e=>{e.preventDefault();void send();}}>
        <input ref={uploadRef} type="file" accept=".txt,.csv,.md,.json,.docx,.pdf,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.webm,.ogg" className="hidden" onChange={upload}/>
        <button type="button" disabled={loading} aria-label="Attach document or audio" onClick={()=>uploadRef.current?.click()}><Paperclip size={18}/></button>
        <button type="button" aria-label={listening?'Stop microphone':'Start microphone'} onClick={()=>{if(listening)recognitionRef.current?.stop();else if(recognitionRef.current){try{recognitionRef.current.start();}catch{setError('Microphone busy; retry karein.');}}else setError('Voice recognition unavailable; text input use karein.');}}><Mic size={18} className={listening?'text-red-600':''}/></button>
        <input aria-label="Agent command" placeholder="Kaam batayein; voice transcript yahan edit kar sakte hain…" value={input} onChange={e=>setInput(e.target.value)} className="flex-1 min-w-0 border rounded-lg p-2 text-xs"/>
        {loading?<button type="button" aria-label="Stop task" onClick={stop}><Square size={18}/></button>:<button type="submit" aria-label="Send command" disabled={!input.trim()}><Send size={18}/></button>}
      </form>
      <p className="text-[10px] text-slate-500">AI planning uses relevant page context and attached text. Sensitive ID fields are excluded. Files remain in this task until New task.</p>
    </footer>
  </section>;
}
