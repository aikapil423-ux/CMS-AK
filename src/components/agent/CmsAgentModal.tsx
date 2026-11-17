"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGuardedRouter as useRouter } from "@/hooks/useGuardedRouter";
import { X, Mic, Send, Paperclip, Loader2, Maximize2, Minimize2, Volume2, Square, RotateCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { WebsiteOperatorSession } from '@/services/agent/websiteOperatorSession';
import { newExperience, type OperatorExperience } from '@/services/agent/operatorExperience';
import { readOperatorAttachment } from '@/services/agent/operatorAttachment';
import { voiceTurn } from '@/services/agent/operatorVoice';
import { CmsVoiceEngine, CmsVoiceStatus, VoicePlan } from '@/services/agent/cmsVoiceEngine';
import { CmsVoiceBadge } from './CmsVoiceBadge';

type Message={id:string;sender:'user'|'agent';text:string;feedback?:boolean};
interface CmsAgentModalProps {isOpen:boolean;onClose:()=>void;anchorPosition:{x:number;y:number}}

export type AgentLanguage = "en-IN" | "hinglish" | "hi-IN";

const welcomeMessages: Record<AgentLanguage, string> = {
  "en-IN": "Jai Hind! I am Parth, your Police AI Copilot. Please give commands in English or say “Hey Parth”. I can navigate across all 8 modules, search case records, look up BNS/BNSS sections, and assist in police investigations. Example: “Open FIR register” or “Search Arms in Acts”.",
  "hinglish": "Jai Hind! Main Parth hoon, aapka Police AI Agent. “Hey Parth” bolein ya Hinglish mein type karein. Main current page, selected case aur aapki di hui details use karunga. Example: “FIR kholo”, “complaints check karo”, ya “BNS 303 search karo”.",
  "hi-IN": "जय हिन्द! मैं पार्थ हूँ, आपका पुलिस एआई एजेंट। “Hey Parth” बोलें या हिन्दी में निर्देश दें। मैं आपके वर्तमान पेज, केस विवरण और कानूनी धाराओं पर कार्य करूँगा। उदाहरण: “एफआईआर रजिस्टर खोलो” या “धारा 303 BNS क्या है”।",
};

const placeholders: Record<AgentLanguage, string> = {
  "en-IN": "“Hey Parth” or type your command (speaking stops playback)...",
  "hinglish": "“Hey Parth” bolein ya type karein (bolte hi agent rukega)...",
  "hi-IN": "“Hey Parth” बोलें या सीधे टाइप करें (बोलते ही एजेंट रुकेगा)...",
};

export function CmsAgentModal({isOpen,onClose}:CmsAgentModalProps){
  const router=useRouter();const {currentUser,isAuthenticated}=useAuth();
  const [lang,setLang]=useState<AgentLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cms_voice_lang') as AgentLanguage;
      if (saved === 'en-IN' || saved === 'hinglish' || saved === 'hi-IN') return saved;
    }
    return 'en-IN';
  });
  const [messages,setMessages]=useState<Message[]>([
    { id: 'welcome', sender: 'agent', text: welcomeMessages["en-IN"] }
  ]);
  const [input,setInput]=useState('');const [loading,setLoading]=useState(false);
  const [expanded,setExpanded]=useState(false);const [listening,setListening]=useState(false);
  const [spoken,setSpoken]=useState(false);
  const [experience,setExperience]=useState<OperatorExperience>(newExperience);
  const [files,setFiles]=useState<{name:string;summary:string;preview:string;uncertainties:string[]}[]>([]);
  const [error,setError]=useState('');
  
  // Resizing state
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 500, height: 680 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{
    direction: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  // Modal Position (Moving modal across page)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const dragModalRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
  } | null>(null);

  useEffect(() => {
    try {
      const savedW = localStorage.getItem("cms_agent_modal_w");
      const savedH = localStorage.getItem("cms_agent_modal_h");
      if (savedW && savedH) {
        const w = parseInt(savedW, 10);
        const h = parseInt(savedH, 10);
        if (!isNaN(w) && !isNaN(h)) {
          const maxW = typeof window !== 'undefined' ? window.innerWidth - 32 : 1200;
          const maxH = typeof window !== 'undefined' ? window.innerHeight - 32 : 900;
          setSize({
            width: Math.min(Math.max(w, 320), maxW),
            height: Math.min(Math.max(h, 400), maxH)
          });
        }
      }

      const savedX = localStorage.getItem("cms_agent_modal_x");
      const savedY = localStorage.getItem("cms_agent_modal_y");
      if (savedX && savedY) {
        const x = parseInt(savedX, 10);
        const y = parseInt(savedY, 10);
        if (!isNaN(x) && !isNaN(y)) {
          const maxLeft = typeof window !== 'undefined' ? Math.max(window.innerWidth - 100, 0) : 800;
          const maxTop = typeof window !== 'undefined' ? Math.max(window.innerHeight - 80, 0) : 600;
          setPosition({
            x: Math.min(Math.max(x, 10), maxLeft),
            y: Math.min(Math.max(y, 10), maxTop)
          });
        }
      }
    } catch {}
  }, []);

  // Initialize position if null
  const getActivePosition = useCallback(() => {
    if (position) return position;
    if (typeof window === 'undefined') return { x: 50, y: 50 };
    return {
      x: Math.max(16, window.innerWidth - size.width - 24),
      y: Math.max(16, window.innerHeight - size.height - 24)
    };
  }, [position, size]);

  // Dragging modal from header
  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    if (expanded) return;
    // Don't drag if clicked on header buttons
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDraggingModal(true);
    const currPos = getActivePosition();
    dragModalRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currPos.x,
      posY: currPos.y,
    };
  };

  const handleHeaderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragModalRef.current) return;
    const { startX, startY, posX, posY } = dragModalRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const maxLeft = Math.max(window.innerWidth - 80, 0);
    const maxTop = Math.max(window.innerHeight - 60, 0);

    const newX = Math.min(Math.max(posX + deltaX, 0), maxLeft);
    const newY = Math.min(Math.max(posY + deltaY, 0), maxTop);

    setPosition({ x: newX, y: newY });
  }, []);

  const handleHeaderPointerEnd = useCallback((e: React.PointerEvent) => {
    if (!dragModalRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    dragModalRef.current = null;
    setIsDraggingModal(false);
    if (position) {
      try {
        localStorage.setItem("cms_agent_modal_x", Math.round(position.x).toString());
        localStorage.setItem("cms_agent_modal_y", Math.round(position.y).toString());
      } catch {}
    }
  }, [position]);

  // Resizing logic from edges & corner
  const handleResizeStart = (e: React.PointerEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsResizing(true);
    const currPos = getActivePosition();
    resizeRef.current = {
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
      startLeft: currPos.x,
      startTop: currPos.y,
    };
  };

  const handleResizeMove = useCallback((e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const { direction, startX, startY, startWidth, startHeight, startLeft, startTop } = resizeRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    const maxW = window.innerWidth - 32;
    const maxH = window.innerHeight - 32;

    // West edge resize (pull left/right)
    if (direction.includes('w')) {
      const candidateWidth = startWidth - deltaX;
      if (candidateWidth >= 320 && candidateWidth <= maxW) {
        newWidth = candidateWidth;
        newLeft = startLeft + deltaX;
      }
    }
    // East edge resize (pull right)
    if (direction.includes('e')) {
      newWidth = Math.min(Math.max(startWidth + deltaX, 320), maxW);
    }
    // North edge resize (pull top)
    if (direction.includes('n')) {
      const candidateHeight = startHeight - deltaY;
      if (candidateHeight >= 380 && candidateHeight <= maxH) {
        newHeight = candidateHeight;
        newTop = startTop + deltaY;
      }
    }
    // South edge resize (pull bottom)
    if (direction.includes('s')) {
      newHeight = Math.min(Math.max(startHeight + deltaY, 380), maxH);
    }

    setSize({ width: newWidth, height: newHeight });
    setPosition({ x: newLeft, y: newTop });
  }, []);

  const handleResizeEnd = useCallback((e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    resizeRef.current = null;
    setIsResizing(false);
    try {
      localStorage.setItem("cms_agent_modal_w", size.width.toString());
      localStorage.setItem("cms_agent_modal_h", size.height.toString());
      if (position) {
        localStorage.setItem("cms_agent_modal_x", Math.round(position.x).toString());
        localStorage.setItem("cms_agent_modal_y", Math.round(position.y).toString());
      }
    } catch {}
  }, [size, position]);

  const sessionRef=useRef<WebsiteOperatorSession|null>(null);
  const attachmentAbortRef=useRef<AbortController|null>(null);
  const busyRef=useRef(false);
  const sendRef=useRef<(text:string)=>void>(()=>{});sendRef.current=text=>{void send(text);};
  const uploadRef=useRef<HTMLInputElement>(null);const endRef=useRef<HTMLDivElement>(null);
  const spokenRef=useRef(spoken);spokenRef.current=spoken;
  const [voicePlan, setVoicePlan] = useState<VoicePlan | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<CmsVoiceStatus>("STANDBY");
  const lastAgentSpeechRef = useRef<string[]>([]);

  const append = (text: string) => {
    lastAgentSpeechRef.current = [text, ...lastAgentSpeechRef.current.slice(0, 5)];
    setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'agent', text }]);
  };

  useEffect(()=>{
    const session=new WebsiteOperatorSession(setExperience);
    session.setLanguage(lang);
    if (currentUser) {
      session.setUser({
        id: currentUser.id || currentUser.beltNumber || currentUser.pno,
        name: currentUser.name,
        role: currentUser.rankDisplay || currentUser.roleDisplay || currentUser.role,
        station: currentUser.stationName,
        district: currentUser.district,
        badgeNumber: currentUser.beltNumber || currentUser.pno
      });
    }
    sessionRef.current=session;
    setExperience(newExperience());
    setMessages([{ id: 'welcome', sender: 'agent', text: welcomeMessages[lang] }]);
    lastAgentSpeechRef.current = [welcomeMessages[lang]];
    setFiles([]);
    setInput('');

    // Configure native CMS Voice Engine
    CmsVoiceEngine.setNavigationHandler((path: string) => {
      router.push(path);
    });

    CmsVoiceEngine.setCommandCallback(async (cmd: string) => {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'user', text: `[Hey Parth] ${cmd}` }]);
      const answer = await session.run(cmd, path => router.push(path));
      append(answer);
      return answer;
    });

    const unsubscribeStatus = CmsVoiceEngine.subscribeStatus((newStatus) => {
      setVoiceStatus(newStatus);
      setListening(newStatus === "LISTENING");
    });

    const unsubscribePlan = CmsVoiceEngine.subscribePlan((plan) => {
      setVoicePlan(plan);
    });

    const unsubscribeTranscript = CmsVoiceEngine.subscribeTranscript(({ text, isFinal, source }) => {
      if (source === "user") {
        setInput(text);
      }
    });

    if (CmsVoiceEngine.isEnabled()) {
      CmsVoiceEngine.startContinuousListening();
    }

    return ()=>{
      unsubscribeStatus();
      unsubscribePlan();
      unsubscribeTranscript();
      attachmentAbortRef.current?.abort();
      session.clear();
      if(sessionRef.current===session) sessionRef.current=null;
    };
  },[currentUser.id,isAuthenticated]);

  useEffect(() => {
    if (sessionRef.current && currentUser) {
      sessionRef.current.setUser({
        id: currentUser.id || currentUser.beltNumber || currentUser.pno,
        name: currentUser.name,
        role: currentUser.rankDisplay || currentUser.roleDisplay || currentUser.role,
        station: currentUser.stationName,
        district: currentUser.district,
        badgeNumber: currentUser.beltNumber || currentUser.pno
      });
    }
  }, [currentUser]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[messages,experience.phase,voicePlan]);

  useEffect(()=>{
    CmsVoiceEngine.setLanguage(lang);
    sessionRef.current?.setLanguage(lang);
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ id: 'welcome', sender: 'agent', text: welcomeMessages[lang] }];
      }
      return prev;
    });
  },[lang]);

  useEffect(()=>{
    if(!isOpen){
      CmsVoiceEngine.stopSpeaking();
    } else {
      if (CmsVoiceEngine.isEnabled()) {
        CmsVoiceEngine.startContinuousListening();
      }
    }
  },[isOpen]);

  useEffect(()=>()=>CmsVoiceEngine.stopSpeaking(),[]);

  async function send(text=input){
    const cmd = (text || input).trim();
    if(!cmd) return;
    if(busyRef.current||loading){setInput(cmd);setError('Pehla command chal raha hai. Yeh command draft mein hai; complete hone par bhejein.');return;}
    if(!isAuthenticated && !currentUser?.id){setError('Pehle sign in karein.');return;}
    const session=sessionRef.current;if(!session)return;
    busyRef.current=true;
    CmsVoiceEngine.handleBargeIn("User submitted command");
    setMessages(prev=>[...prev,{id:crypto.randomUUID(),sender:'user',text:cmd}]);setInput('');setLoading(true);setError('');
    try{
      const answer=await session.run(cmd,path=>router.push(path));
      if(sessionRef.current!==session)return;
      append(answer);
      if(spokenRef.current){
        void CmsVoiceEngine.speak(answer);
      }
    }catch(e){setError(e instanceof Error?e.message:'Command failed');}finally{busyRef.current=false;setLoading(false);}
  }
  async function upload(event:React.ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];event.target.value='';if(!file||loading)return;
    const session=sessionRef.current;const controller=new AbortController();attachmentAbortRef.current=controller;setLoading(true);setError('');
    try{
      const result=await readOperatorAttachment(file,controller.signal);if(controller.signal.aborted||!session||session!==sessionRef.current)return;
      session.addAttachment(file.name,result.text);
      setFiles(prev=>[...prev,{name:file.name,summary:result.summary,preview:result.text,uncertainties:result.uncertainties}].slice(-3));
      append(`${file.name}: ${result.summary} Extracted facts/source preview dekhkar batayein kya karna hai. Unclear details guess nahi ki jayengi.`);
    }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Attachment failed');}finally{if(attachmentAbortRef.current===controller){attachmentAbortRef.current=null;setLoading(false);}}
  }
  function stop(){
    attachmentAbortRef.current?.abort();
    sessionRef.current?.stop();
    CmsVoiceEngine.handleBargeIn("User stop action");
    CmsVoiceEngine.replan("User stop requested");
  }
  function reset(){
    stop();
    const session=new WebsiteOperatorSession(setExperience);
    session.setLanguage(lang);
    sessionRef.current=session;
    setExperience(newExperience());
    setMessages([{ id: 'welcome', sender: 'agent', text: welcomeMessages[lang] }]);
    setFiles([]);
    setInput('');
    setError('');
    setVoicePlan(null);
  }
  function exportReport(){const data=sessionRef.current?.report();const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='cms-agent-quality-report.json';a.click();URL.revokeObjectURL(url);}
  if(!isOpen)return null;

  const currentPos = getActivePosition();

  return <section
    data-cms-agent-ui
    aria-label="CMS AI workspace"
    style={
      expanded
        ? undefined
        : {
            position: 'fixed',
            left: `${currentPos.x}px`,
            top: `${currentPos.y}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 32px)',
          }
    }
    className={`fixed z-50 flex flex-col bg-white border border-slate-300 shadow-2xl rounded-2xl select-none ${
      isResizing || isDraggingModal ? 'transition-none select-none pointer-events-auto' : 'transition-[width,height] duration-75'
    } ${
      expanded
        ? 'inset-4 sm:inset-8 max-w-6xl mx-auto'
        : ''
    }`}
  >
    {/* Resizing handles (edges & corners) - enabled when not expanded, transparent with NO blue highlight */}
    {!expanded && (
      <>
        {/* Top edge */}
        <div
          onPointerDown={e => handleResizeStart(e, 'n')}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerCancel={handleResizeEnd}
          className="absolute -top-1 left-2 right-2 h-2 cursor-ns-resize z-50 bg-transparent"
        />
        {/* Left edge */}
        <div
          onPointerDown={e => handleResizeStart(e, 'w')}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerCancel={handleResizeEnd}
          className="absolute -left-1 top-2 bottom-2 w-2 cursor-ew-resize z-50 bg-transparent"
        />
        {/* Right edge */}
        <div
          onPointerDown={e => handleResizeStart(e, 'e')}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerCancel={handleResizeEnd}
          className="absolute -right-1 top-2 bottom-2 w-2 cursor-ew-resize z-50 bg-transparent"
        />
        {/* Bottom edge */}
        <div
          onPointerDown={e => handleResizeStart(e, 's')}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerCancel={handleResizeEnd}
          className="absolute -bottom-1 left-2 right-2 h-2 cursor-ns-resize z-50 bg-transparent"
        />
        {/* Top-Left Corner handle - completely transparent */}
        <div
          onPointerDown={e => handleResizeStart(e, 'nw')}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerCancel={handleResizeEnd}
          className="absolute -top-2 -left-2 w-6 h-6 cursor-nwse-resize z-50 bg-transparent"
        />
        {/* Bottom-Right Corner handle - completely transparent */}
        <div
          onPointerDown={e => handleResizeStart(e, 'se')}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerCancel={handleResizeEnd}
          className="absolute -bottom-2 -right-2 w-6 h-6 cursor-nwse-resize z-50 bg-transparent"
        />
      </>
    )}

    {/* Header with mouse move/drag handle */}
    <header
      onPointerDown={handleHeaderPointerDown}
      onPointerMove={handleHeaderPointerMove}
      onPointerUp={handleHeaderPointerEnd}
      onPointerCancel={handleHeaderPointerEnd}
      className={`bg-slate-950 text-white p-3 flex items-center justify-between gap-2 rounded-t-2xl select-none ${
        expanded ? 'cursor-default' : 'cursor-move active:cursor-grabbing'
      }`}
    >
      <div className="flex items-center gap-2 select-none pointer-events-none">
        <div>
          <h2 className="font-bold text-sm flex items-center gap-1.5 text-blue-200">
            Parth · AI Police Agent
          </h2>
          <p className="text-[10px] text-slate-300">{currentUser.stationName} · {experience.phase}</p>
        </div>
      </div>
      <div className="flex gap-2 items-center pointer-events-auto">
        <CmsVoiceBadge compact />
        <button type="button" aria-label={spoken?'Disable spoken replies':'Enable spoken replies'} aria-pressed={spoken} onClick={()=>{setSpoken(!spoken);CmsVoiceEngine.stopSpeaking();}}><Volume2 size={17}/></button>
        <button type="button" aria-label={expanded?'Minimize workspace':'Expand workspace'} onClick={()=>setExpanded(!expanded)}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button>
        <button type="button" aria-label="Close agent" onClick={onClose}><X size={18}/></button>
      </div>
    </header>
    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 select-text">
      {/* Live Voice Plan & Re-planning Execution Card */}
      {voicePlan && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 text-xs shadow-xs">
          <div className="flex items-center justify-between font-semibold text-indigo-900 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              आवाज योजना (Voice Plan): {voicePlan.cleanIntent}
            </span>
            <span className="text-[10px] bg-indigo-200/70 text-indigo-800 px-1.5 py-0.5 rounded font-mono">
              {voiceStatus}
            </span>
          </div>
          <p className="text-[11px] text-indigo-700 italic mb-2">
            &ldquo;{voicePlan.originalCommand}&rdquo;
          </p>
          {voicePlan.steps.length > 0 && (
            <ul className="space-y-1 mt-1 pl-1">
              {voicePlan.steps.map((s, idx) => (
                <li key={s.id || idx} className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      s.status === "completed"
                        ? "bg-emerald-600 text-white"
                        : s.status === "running"
                        ? "bg-blue-600 text-white animate-pulse"
                        : s.status === "failed"
                        ? "bg-red-600 text-white"
                        : s.status === "cancelled"
                        ? "bg-slate-400 text-white line-through"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {s.status === "completed" ? "✓" : idx + 1}
                  </span>
                  <span
                    className={`${
                      s.status === "completed"
                        ? "text-emerald-900 font-medium"
                        : s.status === "cancelled"
                        ? "text-slate-400 line-through"
                        : "text-slate-800"
                    }`}
                  >
                    {s.description}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
    <footer className="p-3 border-t space-y-2 rounded-b-2xl bg-white select-text">
      <div className="flex justify-between items-center text-xs">
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Wake Word: <strong>&ldquo;Hey Parth&rdquo;</strong> (Hands-free active)
        </span>
        <select
          aria-label="Agent Language"
          value={lang}
          onChange={e=>setLang(e.target.value as AgentLanguage)}
          className="bg-slate-100 border border-slate-200 rounded px-2.5 py-1 text-[11px] font-medium text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="en-IN">English (English)</option>
          <option value="hinglish">Hinglish (हिंग्लिश)</option>
          <option value="hi-IN">हिन्दी (Hindi)</option>
        </select>
      </div>
      <form className="flex items-center gap-2" onSubmit={e=>{e.preventDefault();void send();}}>
        <input ref={uploadRef} type="file" accept=".txt,.csv,.md,.json,.docx,.pdf,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.webm,.ogg" className="hidden" onChange={upload}/>
        <button type="button" disabled={loading} aria-label="Attach document or audio" onClick={()=>uploadRef.current?.click()}><Paperclip size={18}/></button>
        <button
          type="button"
          aria-label={listening ? 'Microphone active (listening)' : 'Start microphone'}
          onClick={() => {
            const next = !CmsVoiceEngine.isEnabled();
            CmsVoiceEngine.setEnabled(next);
            if (next) {
              CmsVoiceEngine.startContinuousListening();
            } else {
              CmsVoiceEngine.stopContinuousListening();
            }
          }}
          title={CmsVoiceEngine.isEnabled() ? 'Hands-free mic active (Click to pause)' : 'Hands-free mic paused (Click to start)'}
          className={`p-1 rounded-full transition-all ${
            CmsVoiceEngine.isEnabled() ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mic size={18} className={listening ? 'text-blue-600 animate-pulse' : ''}/>
        </button>
        <input
          aria-label="Agent command"
          placeholder={placeholders[lang]}
          value={input}
          onChange={e=>{setInput(e.target.value);}}
          className="flex-1 min-w-0 border rounded-lg p-2 text-xs"
        />
        {loading?<button type="button" aria-label="Stop task" onClick={stop}><Square size={18}/></button>:<button type="submit" aria-label="Send command" disabled={!input.trim()}><Send size={18}/></button>}
      </form>
    </footer>
  </section>;
}
