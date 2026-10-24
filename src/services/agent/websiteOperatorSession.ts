import { LiveWebsiteBridge, matchControls, normalizeCommand, OperatorAction, OperatorPlan, OperatorRoute, planLocally, splitWorkflow } from './websiteOperator';

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
  addAttachment(name:string,text:string) {this.attachments=[...this.attachments,{name:name.slice(0,200),text:text.slice(0,40000)}].slice(-3);}

  private generation = 0;
  clear() {this.generation++;this.remaining=[];this.continueObjective=undefined;this.attachments=[];this.history=[];this.approval=undefined;this.pendingField=undefined;}
  private async catalogue() {
    try {
      const res=await fetch('/api/cms-agent/operator',{cache:'no-store'});
      if(res.ok) {const data=await res.json();this.routes=data.routes;return !!data.modelAvailable;}
    } catch { /* visible links remain usable */ }
    return false;
  }
  async run(text:string,navigate:(path:string)=>void):Promise<string> {
    if(this.busy) return 'एक command चल रही है; उसके पूरा होने दें।';
    this.busy=true;
    const generation=this.generation;
    try {
      const isAnswer=!!(this.approval || this.pendingField);
      if(!isAnswer && /^(continue|aage|आगे)$/i.test(text.trim()) && this.remaining.length) text=this.remaining.shift()!;
      else if(!isAnswer){this.remaining=splitWorkflow(text);text=this.remaining.shift() || text;this.continueObjective=undefined;}
      const output:string[]=[];
      for(let step=0;step<8;step++) {
        this.stepFailed=false;
        output.push(await this.process(text,navigate));
        if(generation!==this.generation || this.approval || this.pendingField || this.stepFailed) break;
        this.forceModel=!!this.continueObjective;
        const next=this.continueObjective || this.remaining.shift();
        this.continueObjective=undefined;
        if(!next) break;
        if(step===7){this.remaining.unshift(next);output.push('8 steps पूरे हुए। आगे के लिए “continue” बोलें।');break;}
        text=next;
      }
      return output.join('\n\n');
    } catch(e) {this.remaining=[];this.continueObjective=undefined;return e instanceof Error?e.message:'Action नहीं हो पाया।';} finally {this.busy=false;}
  }
  private async process(text:string,navigate:(path:string)=>void):Promise<string> {
    const generation=this.generation;
    const q=normalizeCommand(text), snapshot=this.bridge.snapshot();
    if (/^(cancel|stop|ruko|रुको|रद्द|नहीं|nahi|no)$/.test(q)) {this.remaining=[];this.continueObjective=undefined;this.approval=undefined;this.pendingField=undefined;this.stepFailed=true;return 'Pending action cancel कर दी। पहले से saved records unchanged हैं।';}
    if (/^(yes|haan|हाँ|approve|confirm|kar do|kardo|कर दो|ठीक है)$/.test(q) && this.approval) {
      const approval=this.approval;this.approval=undefined;
      if(approval.path!==snapshot.path || approval.fingerprint!==JSON.stringify(snapshot.controls)) {this.remaining=[];this.continueObjective=undefined;this.stepFailed=true;return 'Page/form बदल गया है। Action दोबारा बोलें और updated details confirm करें।';}
      const result=await this.bridge.perform(approval.action,true);
      this.history.push({role:'assistant',text:result});
      if(this.bridge.snapshot().errors.length) this.stepFailed=true;
      return result;
    }
    // Any new instruction invalidates a previous approval; it cannot approve a different plan.
    this.approval=undefined;
    let plan:OperatorPlan;
    const modelAvailable=await this.catalogue();
    const visibleRoutes=snapshot.controls.filter(c=>c.href).map(c=>({path:c.href!,title:c.label}));
    if(this.pendingField && this.pendingField.path===snapshot.path && !/\b(open|save|cancel|search|click|press|select|print|download|upload|delete|reset|preview|copy|help)\b|क्या जानकारी|क्या बाकी/.test(q) && !/[=:]/.test(text)) {
      plan={message:'',actions:[{type:'fill',id:this.pendingField.id,value:text.trim()}]};this.pendingField=undefined;
    } else {
      this.pendingField=undefined;
      plan=planLocally(text,snapshot,[...new Map([...this.routes,...visibleRoutes].map(r=>[r.path,r])).values()]);
      if((this.forceModel || plan.question || this.attachments.length>0 || /[?]|\b(can you|could you|please help|mujhe|bana do|prepare)\b/i.test(text)) && modelAvailable) {
        try {
          const res=await fetch('/api/cms-agent/operator',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(110000),body:JSON.stringify({text,snapshot,history:this.history.slice(-10),attachments:this.attachments})});
          if(res.ok) plan=await res.json();
          else {this.stepFailed=true;return 'AI planner unavailable है। Configuration/quota check करें या page और field का exact नाम दें।';}
        } catch {this.stepFailed=true;return 'AI planner response नहीं मिला; command execute नहीं की।';}
      }
    }
    this.history.push({role:'user',text});
    this.forceModel=false;
    if (generation!==this.generation || this.bridge.snapshot().path!==snapshot.path) return 'Page/session बदल गया। Current page पर command दोबारा दें।';
    const results:string[]=[];
    if(plan.continue && plan.actions.length) this.continueObjective=text;
    for(const action of plan.actions) {
      if(generation!==this.generation) return "Session बदल गया; command रोक दी।";
      if(action.type==='navigate') {
        if(!action.path.startsWith('/') || action.path.startsWith('//') || ![...this.routes,...visibleRoutes].some(r=>r.path===action.path)) throw Error('यह route available नहीं है।');
        navigate(action.path);
        let reached=false;
        for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,100));if(location.pathname+location.search===action.path){await new Promise(r=>setTimeout(r,500));reached=true;break;}}
        results.push(reached?`Page खुल गया: ${action.path}।`:'Navigation शुरू हुई; page खुलने की पुष्टि अभी नहीं हुई।');
        if(!reached) this.stepFailed=true;
        break;
      }
      const live=this.bridge.snapshot();
      const target=live.controls.find(c=>c.id===action.id);
      if(!target) {this.stepFailed=true;results.push('Screen बदल गई; अगले step के लिए current field/button बताएं।');break;}
      if(action.type==='click' && this.bridge.requiresApproval(target)) {
        this.approval={path:live.path,fingerprint:JSON.stringify(live.controls),action,label:target.label};
        results.push(`“${target.label}” पर action करना है। Current page: ${live.path}। Confirm करने के लिए “हाँ”, रोकने के लिए “cancel” बोलें।`);break;
      }
      try {results.push(await this.bridge.perform(action));} catch(e) {this.stepFailed=true;results.push(e instanceof Error?e.message:'Step failed');break;}
    }
    const after=this.bridge.snapshot();
    if(!this.approval && !this.stepFailed) {
      const missing=after.controls.filter(c=>c.kind==='field' && c.required && !c.disabled && !c.value);
      const askMatch=plan.question?matchControls(after.controls.filter(c=>c.kind==='field'&&!c.disabled),plan.question.replace(/में क्या भरना है|कौन सा field/g,'')):[];
      const next=askMatch.length===1?askMatch[0]:plan.actions.some(a=>a.type==='fill')?missing[0]:undefined;
      if(next){this.pendingField={path:after.path,id:next.id,label:next.label};results.push(`${next.label} बताएं।`);}
      else if(plan.question) {this.stepFailed=true;results.push(plan.question);}
    }
    const answer=results.join('\n\n') || plan.message || 'Command स्पष्ट नहीं है। Page/field का नाम बताएं।';
    this.history.push({role:'assistant',text:answer});this.history=this.history.slice(-12);
    return answer;
  }
}
