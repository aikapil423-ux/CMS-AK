const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function session(store) {
  const modules=new Map(), handlers={};
  const window={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},addEventListener:(name,fn)=>{handlers[name]=fn;}};
  function load(file) {
    if(modules.has(file)) return modules.get(file);
    const exports={};modules.set(file,exports);
    const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    vm.runInNewContext(code,{exports,window,console,Date,Intl,structuredClone,require(name){
      if(name==='./complaintService') return {ComplaintService:{}};
      if(name==='./evidenceBlobStore') return {evidenceBlobStore:{}};
      if(name==='@/lib/mockData') return {MOCK_ENQUIRY_OFFICERS:[]};
      if(name==='@/types')return load('src/types/index.ts');
      if(name.startsWith('@/'))return load(`src/${name.slice(2)}.ts`);
      return {};
    }});return exports;
  }
  return {service:load('src/services/firService.ts').firService,handlers};
}

module.exports = { session };
