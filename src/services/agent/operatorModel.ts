// Server-only Gemini transport shared by planning and attachment extraction.
let cachedModel: {name:string;expires:number} | undefined;
export async function operatorModel(): Promise<string> {
  if (!process.env.GEMINI_API_KEY) throw Error('GEMINI_API_KEY is not configured');
  if (process.env.CMS_AGENT_MODEL) {
    if (!/^[a-zA-Z0-9._-]+$/.test(process.env.CMS_AGENT_MODEL)) throw Error('Invalid CMS_AGENT_MODEL');
    return process.env.CMS_AGENT_MODEL;
  }
  if (cachedModel && cachedModel.expires>Date.now()) return cachedModel.name;
  const res=await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    headers:{'x-goog-api-key':process.env.GEMINI_API_KEY},signal:AbortSignal.timeout(15000),cache:'no-store'});
  if(!res.ok) throw Error(`Model discovery unavailable (${res.status})`);
  const data=await res.json();
  const names=(data.models || []).filter((m:{name:string;supportedGenerationMethods?:string[]})=>m.supportedGenerationMethods?.includes('generateContent'))
    .map((m:{name:string})=>m.name.replace(/^models\//,'')) as string[];
  const name=['gemini-3.8-flash','gemini-3.7-flash','gemini-3.5-flash','gemini-2.5-flash','gemini-2.5-flash-lite'].find(n=>names.includes(n));
  if(!name) throw Error('Set CMS_AGENT_MODEL to an available generateContent model');
  cachedModel={name,expires:Date.now()+300000};return name;
}
export async function generateOperatorJson(system:string,parts:unknown[]):Promise<unknown> {
  const model=await operatorModel();
  const signal=AbortSignal.timeout(25000);
  const request=()=>fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
    method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY!},signal,
    body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts}],generationConfig:{temperature:0,responseMimeType:'application/json',...(model.startsWith('gemini-3')?{thinkingConfig:{thinkingLevel:'low'}}:{})}})});
  let response;
  try {response=await request();} catch(error) {
    if(signal.aborted) throw Error('AI service timed out');
    throw Error('AI service connection failed');
  }
  // Retry transient provider failure only; this endpoint proposes actions, never executes them.
  if([502,503,504].includes(response.status))response=await request();
  if(!response.ok) throw Error(`AI service unavailable (${response.status})`);
  const body=await response.json();
  const raw=body.candidates?.[0]?.content?.parts?.map((p:{text?:string})=>p.text || '').join('') || '';
  return JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g,''));
}
