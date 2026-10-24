import { newExperience, normaliseFieldValue, privatePlanningSnapshot, redactSensitiveText, type OperatorExperience } from "./operatorExperience";
import { LiveWebsiteBridge, matchControls, missingRequired, normalizeCommand, OperatorAction, OperatorPlan, OperatorRoute, planLocally, splitWorkflow } from './websiteOperator';

export class WebsiteOperatorSession {
  readonly bridge = new LiveWebsiteBridge();
  private history: {role:'user'|'assistant';text:string}[] = [];
  private approval?: {path:string; fingerprint:string; action:OperatorAction; label:string};
  private pendingField?: {path:string;id:string;label:string};
  private routes: OperatorRoute[] = [];
  private busy = false;
  private remaining: string[] = [];
  private continueObjective?: string;
  private attachments: {name:string;text:string}[] = [];
  private stepFailed = false;
  private forceModel = false;
  private seenPlans = new Set<string>();
  addAttachment(name:string,text:string) {this.attachments=[...this.attachments,{name:name.slice(0,200),text:text.slice(0,40000)}].slice(-3);}

  private experience=newExperience();
  private listener?: (state:OperatorExperience)=>void;
  private controller?:AbortController;
  private choices?: {path:string;fingerprint:string;items:NonNullable<OperatorPlan['choices']>};
  private review?:{path:string;fingerprint:string;plan:OperatorPlan;text:string};
  private undoStack:{path:string;id:string;before:string;after:string;label:string}[]=[];
  private lastField?:{path:string;id:string;label:string};
  private retryText?:string;
  private audit:{time:string;operation:string;outcome:string}[]=[];
  constructor(listener?:(state:OperatorExperience)=>void){this.listener=listener;}
  private publish(phase:OperatorExperience['phase'],step?:string) {
    this.experience.phase=phase;
    if(step)this.experience.steps=[...this.experience.steps,step].slice(-20);
    this.listener?.({...this.experience,steps:[...this.experience.steps],review:[...this.experience.review],choices:[...this.experience.choices],metrics:{...this.experience.metrics}});
  }
  feedback(helpful:boolean){this.experience.metrics[helpful?'helpful':'unhelpful']++;this.publish(this.experience.phase);}
  report(){return {metrics:{...this.experience.metrics},events:[...this.audit]};}
  stop(){this.experience.choices=[];this.experience.review=[];this.generation++;this.controller?.abort();this.remaining=[];this.approval=undefined;this.pendingField=undefined;this.review=undefined;this.choices=undefined;this.continueObjective=undefined;this.publish('stopped','Stopped by user');}
  private record(operation:string,outcome:string){this.audit.push({time:new Date().toISOString(),operation,outcome});this.audit=this.audit.slice(-100);}
  private generation = 0;
  clear() {this.stop();this.undoStack=[];this.lastField=undefined;this.retryText=undefined;this.experience=newExperience();this.remaining=[];this.continueObjective=undefined;this.attachments=[];this.history=[];this.approval=undefined;this.pendingField=undefined;}
  private async catalogue() {
    try {
      const res=await fetch('/api/cms-agent/operator',{cache:'no-store'});
      if(res.ok) {const data=await res.json();this.routes=data.routes;return !!data.modelAvailable;}
    } catch { /* visible links remain usable */ }
    return false;
  }
  async run(text:string,navigate:(path:string)=>void):Promise<string> {
    if(/^(stop|ruko|रुको|cancel)$/i.test(text.trim())){this.stop();return 'Workflow रोक दिया। पहले किए गए changes undo नहीं हुए।';}
    if(this.busy) return 'एक command चल रही है; उसके पूरा होने दें।';
    if(/^(undo|wapas|वापस|पिछला बदलाव वापस)$/i.test(text.trim())) {
      const entry=this.undoStack.pop();const live=this.bridge.snapshot();const field=live.controls.find(c=>c.id===entry?.id);
      if(!entry || live.path!==entry.path || !field || field.value!==entry.after)return 'Undo available नहीं है या field manually बदल गया है।';
      const result=await this.bridge.perform({type:'fill',id:entry.id,value:entry.before});this.record('undo','field_restored');return `${result} यह field-level undo है; saved record rollback नहीं है।`;
    }
    let retrying=false;
    if(/^(retry|resume|दोबारा)$/i.test(text.trim()) && this.retryText){text=this.retryText;this.retryText=undefined;retrying=true;}
    this.busy=true;this.controller=new AbortController();
    const started=Date.now();
    this.experience.metrics.tasks++;
    this.publish('planning');
    const generation=this.generation;
    try {
      const isApprovalAnswer=!!this.approval && /^(yes|haan|हाँ|approve|confirm|kar do|kardo|कर दो|ठीक है)$/i.test(text.trim());
      const isAnswer=isApprovalAnswer || !!this.pendingField || !!this.review || !!this.choices;
      if(!isAnswer && /^(continue|aage|आगे)$/i.test(text.trim()) && this.remaining.length) text=this.remaining.shift()!;
      else if(!isAnswer && !retrying){this.remaining=splitWorkflow(text);text=this.remaining.shift() || text;this.continueObjective=undefined;this.forceModel=false;this.seenPlans.clear();this.experience.objective=text;this.experience.steps=[];}
      const output:string[]=[];
      for(let step=0;step<8;step++) {
        this.stepFailed=false;
        this.publish('running',`Step ${step+1}`);
        output.push(await this.process(text,navigate));
        if(generation!==this.generation || this.approval || this.review || this.choices || this.pendingField || this.stepFailed) break;
        this.forceModel=!!this.continueObjective;
        const next=this.continueObjective || this.remaining.shift();
        this.continueObjective=undefined;
        if(!next) break;
        if(step===7){this.remaining.unshift(next);output.push('8 steps पूरे हुए। आगे के लिए “continue” बोलें।');break;}
        text=next;
      }
      return output.join('\n\n');
    } catch(e) {this.stepFailed=true;this.experience.metrics.failures++;this.record('workflow','failed');this.remaining=[];this.continueObjective=undefined;return e instanceof Error?e.message:'Action नहीं हो पाया।';} finally {this.busy=false;this.experience.metrics.elapsedMs+=Date.now()-started;if(this.experience.phase==='running'||this.experience.phase==='planning')this.publish(this.stepFailed?'blocked':this.approval||this.review?'review':this.pendingField||this.choices?'question':'finished');}
  }
  private async process(text:string,navigate:(path:string)=>void):Promise<string> {
    const generation=this.generation;
    let q=normalizeCommand(text);const snapshot=this.bridge.snapshot();
    let suppliedPlan:OperatorPlan|undefined;let reviewed=false;
    const yes=/^(yes|haan|हाँ|approve|confirm|kar do|kardo|कर दो|ठीक है)$/i.test(text.trim());
    if(this.review && yes){const r=this.review;this.review=undefined;this.experience.review=[];if(r.path!==snapshot.path||r.fingerprint!==JSON.stringify(snapshot.controls)){this.stepFailed=true;return 'Review के बाद form बदला; command दोबारा दें।';}suppliedPlan=r.plan;text=r.text;reviewed=true;}
    else if(this.review){this.review=undefined;this.experience.review=[];}
    const choice=text.match(/^choose\s+(\d+)$/i);
    if(this.choices && choice){const c=this.choices;this.choices=undefined;this.experience.choices=[];const selected=c.items[Number(choice[1])-1];if(!selected||c.path!==snapshot.path||c.fingerprint!==JSON.stringify(snapshot.controls)){this.stepFailed=true;return 'Choices बदल गए; command दोबारा दें।';}suppliedPlan={message:selected.label,actions:selected.actions};}
    if(!suppliedPlan && this.lastField?.path===snapshot.path){const correction=text.match(/^(?:nahi|नहीं|no)[,，]?\s+(.+?)\s+(?:nahi|नहीं|not)[,，]?\s+(.+)$/i);const pronoun=text.match(/^(?:isko|ise|इसको|इसे)\s*(?:=|mein|में|to)\s*(.+)$/i);if(correction||pronoun){suppliedPlan={message:'Correction',actions:[{type:'fill',id:this.lastField.id,value:(correction?.[2]||pronoun?.[1])!.trim()}]};}}
    if (/^(cancel|stop|ruko|रुको|रद्द|नहीं|nahi|no)$/.test(q)) {this.remaining=[];this.continueObjective=undefined;this.approval=undefined;this.pendingField=undefined;this.stepFailed=true;return 'Pending action cancel कर दी। पहले से saved records unchanged हैं।';}
    if (/^(yes|haan|हाँ|approve|confirm|kar do|kardo|कर दो|ठीक है)$/.test(q) && this.approval) {
      const approval=this.approval;this.approval=undefined;
      if(approval.path!==snapshot.path || approval.fingerprint!==JSON.stringify(snapshot.controls)) {this.remaining=[];this.continueObjective=undefined;this.stepFailed=true;return 'Page/form बदल गया है। Action दोबारा बोलें और updated details confirm करें।';}
      const result=await this.bridge.perform(approval.action,true);
      this.undoStack=[];this.record('confirmed_action',/receipt.*verify नहीं|अभी verify नहीं/.test(result)?'unverified':'activated');
      if(/अभी verify नहीं/.test(result)){this.stepFailed=true;this.continueObjective=undefined;this.remaining=[];}
      this.publish('running',result);
      this.history.push({role:'assistant',text:result});
      if(this.bridge.snapshot().errors.length) this.stepFailed=true;
      return result;
    }
    // Any new instruction invalidates a previous approval; it cannot approve a different plan.
    this.approval=undefined;
    let plan:OperatorPlan;let usedModel=false;
    const modelAvailable=await this.catalogue();
    const visibleRoutes=snapshot.controls.filter(c=>c.href).map(c=>({path:c.href!,title:c.label}));
    if(suppliedPlan) plan=suppliedPlan;
    else if(this.pendingField && this.pendingField.path===snapshot.path && !/\b(open|save|cancel|search|click|press|select|print|download|upload|delete|reset|preview|copy|help)\b|क्या जानकारी|क्या बाकी/.test(q) && !/[=:]/.test(text)) {
      plan={message:'',actions:[{type:'fill',id:this.pendingField.id,value:text.trim()}]};this.pendingField=undefined;
    } else {
      this.pendingField=undefined;
      plan=planLocally(text,snapshot,[...new Map([...this.routes,...visibleRoutes].map(r=>[r.path,r])).values()]);
      if(!plan.choices?.length && (this.forceModel || plan.question || this.attachments.length>0 || /[?]|\b(can you|could you|please help|mujhe|bana do|prepare)\b/i.test(text)) && modelAvailable) {
        try {
          this.publish('planning','AI planning');
          const res=await fetch('/api/cms-agent/operator',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.any([AbortSignal.timeout(110000),this.controller!.signal]),body:JSON.stringify({text:redactSensitiveText(text),snapshot:privatePlanningSnapshot(snapshot,text),history:this.history.slice(-10).map(h=>({...h,text:redactSensitiveText(h.text)})),attachments:this.attachments.map(a=>({...a,text:redactSensitiveText(a.text)}))})});
          if(res.ok) {plan=await res.json();usedModel=true;}
          else {this.stepFailed=true;this.retryText=text;this.experience.metrics.failures++;this.record('planning','failed');return 'AI planner unavailable है। Configuration/quota check करें या page और field का exact नाम दें।';}
        } catch {if(generation!==this.generation)return 'Task रोक दिया।';this.stepFailed=true;this.retryText=text;this.experience.metrics.failures++;this.record('planning','failed');return 'AI planner response नहीं मिला; command execute नहीं की।';}
      }
    }
    this.history.push({role:'user',text});
    this.forceModel=false;
    const beforeExecution=this.bridge.snapshot();
    if (generation!==this.generation || beforeExecution.path!==snapshot.path || JSON.stringify(beforeExecution.controls)!==JSON.stringify(snapshot.controls)) {
      this.stepFailed=true;this.continueObjective=undefined;
      return 'Page/form/session बदल गया। Current details पर command दोबारा दें।';
    }
    if(plan.choices?.length){this.choices={path:snapshot.path,fingerprint:JSON.stringify(snapshot.controls),items:plan.choices};this.experience.choices=plan.choices.map(c=>c.label);this.experience.metrics.questions++;this.publish('question');this.stepFailed=true;return plan.question||'एक option चुनें।';}
    const results:string[]=[];
    for(const action of plan.actions)if(action.type==='fill'){const field=snapshot.controls.find(c=>c.id===action.id);if(field)action.value=normaliseFieldValue(field,action.value);}
    if(usedModel && !reviewed && plan.actions.some(a=>a.type==='fill')){
      this.review={path:snapshot.path,fingerprint:JSON.stringify(snapshot.controls),plan,text};
      this.experience.review=plan.actions.filter(a=>a.type==='fill').map(a=>({label:snapshot.controls.find(c=>c.id===a.id)?.label||a.id,before:snapshot.controls.find(c=>c.id===a.id)?.value||'',after:a.value}));
      this.publish('review');return 'AI ने ये field changes प्रस्तावित किए हैं। Existing/source facts में conflict हो तो सुधार बताएं। Apply के लिए हाँ, रोकने के लिए cancel।';
    }
    const signature=JSON.stringify([snapshot.path,plan.actions]);
    if(plan.actions.length && this.seenPlans.has(signature)) {this.stepFailed=true;this.continueObjective=undefined;return 'Same action repeat हो रही थी, इसलिए workflow रोक दिया। अगला step स्पष्ट बताएं।';}
    if(plan.actions.length) this.seenPlans.add(signature);
    if(plan.continue && plan.actions.length) this.continueObjective=text;
    for(const action of plan.actions) {
      if(generation!==this.generation) return "Session बदल गया; command रोक दी।";
      if(action.type==='navigate') {
        if(!action.path.startsWith('/') || action.path.startsWith('//') || ![...this.routes,...visibleRoutes].some(r=>r.path===action.path)) throw Error('यह route available नहीं है।');
        navigate(action.path);
        let reached=false;
        for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,100));if(location.pathname+location.search===action.path){await new Promise(r=>setTimeout(r,500));reached=true;break;}}
        results.push(reached?`Page खुल गया: ${action.path}।`:'Navigation शुरू हुई; page खुलने की पुष्टि अभी नहीं हुई।');
        if(!reached) this.stepFailed=true;else {this.experience.metrics.verifiedSteps++;this.record('navigate','verified');this.publish('running',`Page verified: ${action.path}`);}
        break;
      }
      const live=this.bridge.snapshot();
      const target=live.controls.find(c=>c.id===action.id);
      if(!target) {this.stepFailed=true;results.push('Screen बदल गई; अगले step के लिए current field/button बताएं।');break;}
      if(action.type==='click' && this.bridge.requiresApproval(target)) {
        const missing=live.controls.find(missingRequired);
        if(missing && /save|submit|register|सहेज|जमा/i.test(target.label)) {
          this.pendingField={path:live.path,id:missing.id,label:missing.label};
          this.remaining.unshift(text);this.seenPlans.delete(signature);
          this.experience.metrics.questions++;results.push(`${live.controls.filter(missingRequired).map(c=>c.label).join(', ')} चाहिए। पहले ${missing.label} बताएं या field = value format में एक साथ भरें।`);break;
        }
        this.approval={path:live.path,fingerprint:JSON.stringify(live.controls),action,label:target.label};
        results.push(`“${target.label}” पर action करना है। Current page: ${live.path}। Confirm करने के लिए “हाँ”, रोकने के लिए “cancel” बोलें।`);break;
      }
      try {const before=target.value||'';results.push(await this.bridge.perform(action));if(action.type==='fill')this.experience.metrics.verifiedSteps++;this.record(action.type,action.type==='fill'?'verified':'activated');if(action.type==='fill'){this.lastField={path:live.path,id:target.id,label:target.label};const updated=this.bridge.snapshot().controls.find(c=>c.id===target.id);if(!['div','span'].includes(target.type))this.undoStack.push({path:live.path,id:target.id,label:target.label,before,after:updated?.value||action.value});this.undoStack=this.undoStack.slice(-20);}this.publish('running',`${target.label}: ${action.type==='fill'?'verified':'activated'}`);} catch(e) {this.stepFailed=true;this.experience.metrics.failures++;this.record(action.type,'failed');results.push(e instanceof Error?e.message:'Step failed');break;}
    }
    const after=this.bridge.snapshot();
    if(!this.approval && !this.pendingField && !this.stepFailed) {
      const missing=after.controls.filter(missingRequired);
      const askMatch=plan.question?matchControls(after.controls.filter(c=>c.kind==='field'&&!c.disabled),plan.question.replace(/में क्या भरना है|कौन सा field/g,'')):[];
      const next=askMatch.length===1?askMatch[0]:plan.actions.some(a=>a.type==='fill') && !this.remaining.length && !this.continueObjective?missing[0]:undefined;
      if(next){this.pendingField={path:after.path,id:next.id,label:next.label};this.experience.metrics.questions++;results.push(`${missing.length?missing.map(c=>c.label).join(', '):next.label} चाहिए। पहले ${next.label} बताएं।`);}
      else if(plan.question) {this.stepFailed=true;results.push(plan.question);}
    }
    const answer=results.join('\n\n') || plan.message || 'Command स्पष्ट नहीं है। Page/field का नाम बताएं।';
    this.history.push({role:'assistant',text:answer});this.history=this.history.slice(-12);
    return answer;
  }
}
