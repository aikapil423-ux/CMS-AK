import { operatorAdapters } from './operatorAdapters';
/** Live website operator. Controls are discovered afresh; no arbitrary selectors or scripts from a model. */
export interface WebsiteControl {
  id: string;
  label: string;
  kind: "field" | "button" | "link";
  type: string;
  value?: string;
  options?: { value: string; label: string }[];
  href?: string;
  required?: boolean;
  disabled: boolean;
  section: string;
}
export interface WebsiteSnapshot {
  path: string;
  title: string;
  controls: WebsiteControl[];
  errors: string[];
}
export type OperatorAction = { type: "fill"; id: string; value: string } | { type: "click"; id: string } | { type: "navigate"; path: string };
export interface OperatorPlan { message: string; actions: OperatorAction[]; question?: string; continue?:boolean; choices?:{label:string;actions:OperatorAction[]}[] }
export interface OperatorRoute { path: string; title: string }
export function missingRequired(control:WebsiteControl):boolean {
  return control.kind==='field' && !!control.required && !control.disabled &&
    (!control.value || (['checkbox','radio'].includes(control.type) && control.value==='false'));
}

export function splitWorkflow(text:string):string[] {
  return text.split(/\s+(?:and then|then|uske baad|phir|फिर|उसके बाद)\s+|\s+(?:aur|और|and)\s+(?=(?:open|click|fill|search|save|download|print)\b)/i).map(s=>s.trim()).filter(Boolean);
}

// Normalize command vocabulary only. Field values retain the user's original text.
const commandAliases: [RegExp, string][] = [
  [/रजिस्टर|रेजिस्टर/gu, 'register'],
  [/कंप्लेंट|कम्प्लेंट|कंप्लेन्ट|कम्प्लेन्ट/gu, 'complaint'],
  [/पेज/gu, 'page'],
  [/टेम्पलेट(?:्स)?|टेंपलेट(?:्स)?|प्रारूप|\btemplates?\b/gu, 'template'],
  [/बटन|\bbuttons?\b/gu, 'button'],
  [/फील्ड इन्क्वायरी|फील्ड एनक्वायरी|जांच कार्यक्षेत्र|जाँच कार्यक्षेत्र|\bfield enquiry\b|\benquiry workspace\b/gu, 'enquiry'],
  [/अनुसंधान|तफ्तीश|इन्वेस्टिगेशन|\binvestigation(?: workspace)?\b/gu, 'fir workspace'],
  [/डाउनलोड|\bdownload karo\b/gu, 'download'],
  [/प्रिंट|छापो|प्रिंटआउट/gu, 'print'],
  [/कॉपी|प्रतिलिपि/gu, 'copy'],
  [/अपलोड/gu, 'upload'],
  [/डिलीट|मिटाओ|हटा दो|\bhata do\b|\bmitao\b/gu, 'delete'],
  [/रीसेट|रिसेट/gu, 'reset'],
  [/प्रीव्यू|पूर्वावलोकन/gu, 'preview'],
  [/नोटिस/gu, 'notice'],
  [/समन/gu, 'summons'],
  [/गिरफ्तारी|गिरफ़्तारी/gu, 'arrest'],
  [/दस्तावेज़|दस्तावेज|\bdocuments\b/gu, 'document'],
  [/दबाओ|दबाएं|क्लिक|\bdabao\b|\bdabaye\b/gu, 'click'],
  [/चुनो|चुनें|\bchuno\b/gu, 'select'],
  [/खोल दो|खोल दीजिए|दिखाओ|\bdikhao\b|\bkholna\b/gu, 'open'],
  [/(?<![\p{L}\p{M}])(?:कृपया|कर दो|करो|करें|पर|को|वाला|वाली|का|की)(?![\p{L}\p{M}])/gu, ' '],
];

export function normalizeCommand(text: string): string {
  const normalized = text.toLowerCase().normalize("NFKC");
  return commandAliases.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), normalized)
    .replace(/[०-९]/g, c => String(c.charCodeAt(0) - 2406))
    .replace(/शिकायत|shikayat/g, "complaint").replace(/मुकदमा|एफआईआर|एफ आई आर/g, "fir")
    .replace(/रोजनामचा|roznamcha|रपट/g, "general diary").replace(/नाम|naam/g, "name")
    .replace(/मोबाइल|मोबाईल|फ़ोन|फोन/g, "mobile").replace(/पता|pata/g, "address")
    .replace(/दिनांक|तारीख|tarikh/g, "date").replace(/खोलो|खोलें|kholo|khol do/g, "open")
    .replace(/भर दो|भरें|भरो|bharo|bhar do/g, "fill").replace(/खोजो|ढूंढो|ढूँढो|dhundo|dhoondo/g, "search")
    .replace(/नई|नया|nayi|naya/g, "new").replace(/सेव|सहेजो|सहेजें|सुरक्षित करो/g, "save")
    .replace(/[^\p{L}\p{M}\p{N}\s/.-]/gu, " ").replace(/\s+/g, " ").trim();
}

function scoreLabel(label: string, query: string): number {
  const a = normalizeCommand(label), b = normalizeCommand(query);
  if (a === b) return 100;
  if (a.includes(b) && b.length > 1) return 60;
  const words = b.split(" ").filter(w => w.length > 1 && !["the", "ko", "ka", "ki", "karo", "please", "form", "page", "open", "fill", "mein", "me", "hai", "kar", "do", "par", "pe", "wala", "wali", "button", "click", "select"].includes(w));
  // Partial matches must not turn "delete notice" into a generic Delete action.
  return words.length && words.every(w => a.includes(w)) ? 40 : 0;
}

export function matchControls(controls: WebsiteControl[], query: string): WebsiteControl[] {
  const ranked = controls.map(c => ({c, score: scoreLabel(`${c.label} ${c.section}`, query)})).filter(x => x.score >= 30).sort((a,b) => b.score-a.score);
  return ranked.length ? ranked.filter(x => x.score === ranked[0].score).map(x => x.c) : [];
}

export function planLocally(text: string, snapshot: WebsiteSnapshot, routes: OperatorRoute[]): OperatorPlan {
  const q = normalizeCommand(text);
  const fields = snapshot.controls.filter(c => c.kind === "field" && !c.disabled);
  if (/^(help|madad|मदद|kya kar|क्या कर)/.test(q) || /missing|required|क्या बाकी|kya baki|क्या जानकारी|kya jankari/.test(q)) {
    const missing = fields.filter(missingRequired);
    return {message: missing.length ? `ये जानकारी चाहिए: ${missing.map(c => c.label).join(", ")}` : `इस पेज पर ${fields.length} fields और ${snapshot.controls.filter(c=>c.kind !== "field").length} actions उपलब्ध हैं। Field का नाम और value बोलें, या page/button का नाम बताएं।`, actions:[]};
  }
  // Extract multiple explicit values. Keep original spelling of user facts.
  const clauses = text.split(/[;\n]|,(?=\s*[^,;\n=:]{1,80}\s*[:=])|\s+(?:aur|और|and)\s+(?=[^,;\n=:]{1,80}\s*[:=])/i);
  const actions: OperatorAction[] = [];
  for (const clause of clauses) {
    const pair = clause.match(/^(?:.*?\b(?:fill|set)\s+)?(.+?)\s*(?:=|:|\s+(?:mein|me|में|is|hai|है)\s+)\s*(.+?)(?:\s+(?:kar do|karo|भर दो|fill kar do))?$/i)
      || clause.match(/(?:^|\s)(name|naam|नाम|mobile|phone|मोबाइल|address|pata|पता|date|दिनांक|तारीख)\s+(.+?)(?:\s+(?:hai|है|karo|kar do))?$/i);
    if (pair) {
      const found = matchControls(fields, pair[1]);
      if (found.length === 1) actions.push({type:"fill", id:found[0].id, value:pair[2].trim()});
      else if (found.length > 1) return {message:"",actions:[],question:'कौन सा field?',choices:found.map(c=>({label:`${c.section}: ${c.label}`,actions:[{type:'fill',id:c.id,value:pair[2].trim()}]}))};
    }
  }
  if (actions.length) return {message:"दी हुई जानकारी भर रहा हूँ।", actions};
  const search = q.match(/(?:search|find)\s+(.+)|(.+?)\s+(?:search|find)/);
  if (search && !/\b(button|click|press)\b/.test(q)) {
    const targets = fields.filter(c => /search|खोज/i.test(c.label));
    if (targets.length === 1) return {message:"Search filter भर रहा हूँ।",actions:[{type:"fill",id:targets[0].id,value:(search[1]||search[2]).trim()}]};
  }
  const wantsOpen = /\b(open|new|register)\b|खोल|दर्ज|likho/.test(q);
  // Prefer an explicitly named control on the current screen over leaving it.
  const localTarget = q.replace(/\b(open|click|press|button|tab|karo|kar do|please|select)\b/g,' ').trim();
  const localMatches = matchControls(snapshot.controls.filter(c=>c.kind!=='field' && !c.disabled), localTarget);
  if (localMatches.length === 1) return {message:localMatches[0].label,actions:[{type:'click',id:localMatches[0].id}]};
  if (wantsOpen) {
    const query = q.replace(/\b(open|karo|page|form|please|mujhe|dikhao|fill|likho)\b/g," ").trim();
    const ranked = routes.map(r => ({r,score:scoreLabel(`${r.title} ${r.path.replace(/[-/]/g," ")}`,query)})).sort((a,b)=>b.score-a.score);
    if (ranked[0]?.score >= 30 && ranked[0].score > (ranked[1]?.score || 0)) return {message:`${ranked[0].r.title} खोल रहा हूँ।`,actions:[{type:"navigate",path:ranked[0].r.path}]};
    const ties = ranked.filter(r=>r.score>=30 && r.score===ranked[0]?.score);
    if(ties.length>1) return {message:'',actions:[],question:'कौन सा page खोलना है?',choices:ties.slice(0,8).map(({r})=>({label:`${r.title} (${r.path})`,actions:[{type:'navigate',path:r.path}]}))};
  }
  const target = q.replace(/\b(open|click|press|button|tab|karo|kar do|please|dabao|select)\b|दबाओ|दबाएं|चुनो/g," ").trim();
  const found = matchControls(snapshot.controls.filter(c=>c.kind!=="field" && !c.disabled), target);
  if (found.length === 1) return {message:found[0].label,actions:[{type:"click",id:found[0].id}]};
  if (found.length > 1) return {message:"",actions:[],question:'कौन सा action?',choices:found.slice(0,8).map(c=>({label:`${c.section}: ${c.label}`,actions:[{type:'click',id:c.id}]}))};
  const field = matchControls(fields, target);
  if (field.length === 1) return {message:"",actions:[],question:`${field[0].label} में क्या भरना है?`};
  return {message:"", actions:[], question:"कौन सा page, field या button? उसका नाम बताएं। जैसे ‘mobile = 9812345678’, ‘FIR register खोलो’, या ‘Documents tab खोलो’।"};
}

export class LiveWebsiteBridge {
  private elements = new Map<string, HTMLElement>();
  private ids = new WeakMap<HTMLElement,string>();
  private sequence = 0;
  private visible(el: HTMLElement) {
    return !el.closest('[data-cms-agent-ui], [hidden], [inert], [aria-hidden="true"]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  }
  snapshot(): WebsiteSnapshot {
    const controls: WebsiteControl[] = [];
    this.elements.clear();
    document.querySelectorAll<HTMLElement>('input,textarea,select,button,a[href],[role="tab"],[role="button"],[role="combobox"],[role="option"],[role="menuitem"],[role="checkbox"],[role="switch"],[contenteditable="true"]').forEach(el => {
      if (!this.visible(el)) return;
      const input = el as HTMLInputElement;
      if (["hidden","password"].includes(input.type)) return;
      const kind = el.matches('input[type="submit"],input[type="button"],input[type="reset"]') ? "button" : el.matches('input,textarea,select,[contenteditable="true"]') ? "field" : el.matches('a[href]') ? "link" : "button";
      let label = el.getAttribute('data-agent-label') || el.getAttribute('aria-label') || "";
      if(!label && el.getAttribute('aria-labelledby')) label=el.getAttribute('aria-labelledby')!.split(/\s+/).map(id=>document.getElementById(id)?.textContent || '').join(' ');
      if (!label && 'labels' in input) label = Array.from(input.labels || []).map(l=>l.textContent).join(" ");
      if (!label && kind === "field") {
        let parent = el.parentElement;
        for (let depth=0; parent && depth<4; depth++,parent=parent.parentElement) {
          const labels = parent.querySelectorAll('label');
          if (labels.length === 1) {label = labels[0].textContent || ""; break;}
        }
      }
      label ||= el.getAttribute('title') || el.getAttribute('placeholder') || (kind === "field" ? el.getAttribute('name') || el.id : el.textContent) || "";
      label = label.replace(/\s+/g," ").trim().slice(0,160);
      if (!label) return;
      let id = this.ids.get(el);
      if (!id) { id = `control_${++this.sequence}`; this.ids.set(el,id); }
      this.elements.set(id,el);
      const section = el.closest('[data-agent-section]')?.getAttribute('data-agent-section') || el.closest('tr,article,section,fieldset,[role="dialog"],[id^="sec-"]')?.querySelector('legend,h1,h2,h3,h4')?.textContent?.trim() || "";
      controls.push({id,label,kind,type:el.getAttribute('role') || input.type || el.tagName.toLowerCase(),section,
        disabled:!!input.disabled || el.getAttribute('aria-disabled') === 'true' || el.getAttribute('aria-readonly') === 'true' || !!input.readOnly,
        required:!!input.required || el.getAttribute('aria-required') === 'true' || /\*/.test(label),
        value:kind === "field" ? (input.type === 'checkbox' || input.type === 'radio' ? String(input.checked) : input.value ?? el.textContent ?? "") : undefined,
        href:el instanceof HTMLAnchorElement && el.origin === location.origin ? el.pathname+el.search : undefined,
        options:el instanceof HTMLSelectElement ? Array.from(el.options).filter(o=>!o.disabled).map(o=>({value:o.value,label:o.text})) : undefined});
    });
    const snapshot:WebsiteSnapshot = {path:location.pathname+location.search,title:document.querySelector('main h1')?.textContent || document.title,controls,
      errors:Array.from(document.querySelectorAll<HTMLElement>('[role="alert"],[aria-invalid="true"]')).filter(el=>this.visible(el)).map(el=>el.textContent?.trim() || el.getAttribute('aria-label') || "Invalid field").filter(Boolean).slice(0,15)};
    return operatorAdapters(snapshot.path).reduce((s,a)=>a.enrich?.(s)||s,snapshot);
  }
  requiresApproval(control: WebsiteControl): boolean {
    const el=this.elements.get(control.id);
    if(/^(search|preview|table view|cards view|next page|previous page)$/i.test(control.label) && el?.getAttribute('type')!=='submit') return false;
    return !(control.kind === "link" && !!control.href) && !['tab','combobox'].includes(control.type) && el?.getAttribute('data-agent-operation')!=='read';
  }
  async perform(action: OperatorAction, approved = false): Promise<string> {
    if (action.type === "navigate") throw Error("Navigation must use the application router.");
    const el = this.elements.get(action.id);
    if (!el || !el.isConnected || !this.visible(el)) throw Error("Page बदल गया है। कृपया command दोबारा दें।");
    const current = this.snapshot().controls.find(c=>c.id===action.id);
    if (!current || current.disabled) throw Error("यह control अभी available/enabled नहीं है।");
    if(operatorAdapters(location.pathname+location.search).some(a=>a.canOperate?.(action.id,action.type)===false)) throw Error('इस module में इस action की अनुमति नहीं है।');
    if (/password|permission|role switch|switch.*persona/i.test(current.label)) throw Error("Account/permission controls सीधे user को operate करने होंगे।");
    if (action.type === 'click') {
      if (/sign out|logout|switch.*persona|role switch|password|permission|delete account/i.test(current.label)) throw Error("Account/permission controls सीधे user को operate करने होंगे।");
      if (this.requiresApproval(current) && !approved) throw Error("इस action की confirmation चाहिए।");
      const write=this.requiresApproval(current) && /save|submit|register|send|delete|issue|सहेज|जमा|भेज/i.test(current.label);
      const previousReceipts=operatorAdapters(location.pathname+location.search).map(a=>{const r=a.receipt?.();return r?`${r.id}:${r.revision}`:'';});
      const previousStatuses=Array.from(document.querySelectorAll('[role="status"],[data-agent-receipt]')).map(n=>n.textContent?.trim());
      el.click();
      await new Promise(r=>setTimeout(r,350));
      const after = this.snapshot();
      if(after.errors.length) throw Error(`Action के बाद validation: ${after.errors.join('; ')}`);
      if(write) {
        for(let i=0;i<20;i++) {
          const receipt=operatorAdapters(location.pathname+location.search).map(a=>a.receipt?.()).find(r=>r&&!previousReceipts.includes(`${r.id}:${r.revision}`));
          if(receipt) return `Verified receipt: ${receipt.label} (${receipt.id})${receipt.url?' '+receipt.url:''}`;
          const status=Array.from(document.querySelectorAll<HTMLElement>('[role="status"],[data-agent-receipt]')).filter(n=>this.visible(n)).map(n=>n.textContent?.trim()).find(t=>t&&!previousStatuses.includes(t)&&/saved|success|created|deleted|सफल|सहेज/i.test(t));
          if(status) return `Website confirmation: ${status}`;
          await new Promise(r=>setTimeout(r,150));
        }
        return `“${current.label}” activate किया; save/submit receipt अभी verify नहीं हुई। Duplicate रोकने के लिए वही action दोबारा न चलाएं; record check करें।`;
      }
      return `“${current.label}” activate किया।`;
    }
    if (current.kind !== 'field') throw Error("यह editable field नहीं है।");
    if (current.type === 'file') { el.click(); return "File picker खुला है; file चुनें।"; }
    const value = action.value;
    let expectedValue=value;
    if (el instanceof HTMLSelectElement) {
      const choices = Array.from(el.options).filter(o=>!o.disabled && (o.value === value || normalizeCommand(o.text) === normalizeCommand(value)));
      if (choices.length!==1) throw Error(`इनमें से चुनें: ${current.options?.map(o=>o.label).join(" / ")}`);
      expectedValue=choices[0].value;
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value')!.set!.call(el,choices[0].value);
      el.dispatchEvent(new Event('change',{bubbles:true}));
    } else if (el instanceof HTMLInputElement && ['checkbox','radio'].includes(el.type)) {
      const checked = /^(true|yes|haan|हाँ|check|1)$/i.test(value);
      if (!checked && !/^(false|no|nahi|नहीं|uncheck|0)$/i.test(value)) throw Error("हाँ या नहीं बताएं।");
      if (el.checked!==checked) el.click();
    } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto,'value')!.set!.call(el,value);
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    } else if (el.isContentEditable) {
      el.textContent = value; el.dispatchEvent(new Event('input',{bubbles:true}));
    } else throw Error("इस custom control के लिए form adapter चाहिए।");
    await new Promise(r=>setTimeout(r,100));
    const after = this.snapshot().controls.find(c=>c.id===action.id);
    if (!after) throw Error("Field बदल गया; value verify नहीं हो सकी।");
    if (!['checkbox','radio'].includes(current.type) && after.value !== expectedValue) throw Error("Form ने value accept नहीं की। सही format में बताएं।");
    const input = el as HTMLInputElement;
    if (input.validity && !input.validity.valid) throw Error(`${current.label}: ${input.validationMessage}`);
    return `${current.label} भरा और value verify की।`;
  }
}
