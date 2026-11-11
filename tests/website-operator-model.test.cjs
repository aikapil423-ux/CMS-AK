const {test}=require('node:test'),assert=require('node:assert/strict');
const ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');
const code=ts.transpileModule(fs.readFileSync('src/lib/openRouter.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function fixture(statuses,{timedOut=false,networkError=false}={}){
  const exports={};let calls=0,timeout;
  const signal={aborted:timedOut};
  vm.runInNewContext(code,{exports,require:n=>n==='server-only'?{}:require(n),process:{env:{OPENROUTER_API_KEY:'test'}},
    AbortSignal:{timeout:ms=>{timeout=ms;return signal}},
    fetch:async(url,options)=>{
      assert.match(url,/openrouter\.ai/);
      assert.equal(options.signal,signal);
      assert.equal(JSON.parse(options.body).model,exports.PROCESSING_MODEL);
      if(networkError)throw Error('fetch failed');
      const status=statuses[calls++];
      return {ok:status===200,status,json:async()=>({choices:[{message:{content:JSON.stringify({message:'ok'})}}]})};
    }});
  return {run:()=>exports.processWithAI([{text:'test'}],{json:true,retryTransient:true,timeout:60000}),calls:()=>calls,timeout:()=>timeout};
}
test('transient provider failure retries planning once',async()=>{const f=fixture([503,200]);assert.equal(JSON.parse(await f.run()).message,'ok');assert.equal(f.calls(),2);});
test('persistent provider failure stops after two attempts',async()=>{const f=fixture([503,503]);await assert.rejects(f.run(),/503/);assert.equal(f.calls(),2);});
test('quota failure is not repeatedly retried',async()=>{const f=fixture([429]);await assert.rejects(f.run(),/429/);assert.equal(f.calls(),1);});
for(const timedOut of [false,true])test(timedOut?'provider timeout has a clear bounded error':'network failure has a clear diagnostic',async()=>{
  const f=fixture([],{timedOut,networkError:true});
  await assert.rejects(f.run(),timedOut?/AI service timed out/:/AI service connection failed/);
  assert.equal(f.timeout(),60000);
});
