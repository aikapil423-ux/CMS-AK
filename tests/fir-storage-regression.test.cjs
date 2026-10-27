const {test}=require('node:test');
const assert=require('node:assert/strict');
const {session}=require('./helpers/fir-service.cjs');
test('stale tab cannot overwrite another tab; storage event refreshes subscribers',()=>{
 const store={}, a=session(store), b=session(store), id=a.service.getAllFirs()[0].id;
 a.service.updateFir(id,{complainantName:'Saved in A'});
 assert.throws(()=>b.service.updateFir(id,{complainantName:'Stale B'}),/another tab/);
 assert.equal(b.service.getFirById(id).complainantName,'Saved in A');
 b.service.updateFir(id,{incidentPlace:'Saved in B'});
 let notified=false;a.service.subscribe(()=>{notified=true;});a.handlers.storage({key:'haryana_police_cms_firs_v2'});
 assert.equal(notified,true);assert.equal(a.service.getFirById(id).incidentPlace,'Saved in B');
 assert.equal(a.service.getFirById(id).complainantName,'Saved in A');
});
test('same FIR numbers in different stations remain distinct when linking and delinking',()=>{
 const {service:s}=session({});const all=s.getAllFirs();
 const groups=new Map();for(const f of all){const list=groups.get(f.firNumber)||[];list.push(f);groups.set(f.firNumber,list);}
 const pair=[...groups.values()].find(g=>g.length>1);assert.ok(pair);
 const [one,two]=pair, primary=all.find(f=>f.firNumber!==one.firNumber);
 assert.throws(()=>s.getFirById(one.firNumber),/Ambiguous/);
 s.linkMultipleFirs({primaryFirId:primary.id,targetFirIds:[one.id,two.id],linkType:'CONNECTED',reason:'test',officerName:'Tester'});
 assert.equal(s.getFirById(primary.id).linkedFirsList.length,2);
 assert.throws(()=>s.delinkFirs({primaryFirId:primary.id,targetFirNumber:one.firNumber,reason:'test',officerName:'Tester'}),/unique ID/);
 s.delinkFirs({primaryFirId:primary.id,targetFirId:two.id,targetFirNumber:two.firNumber,reason:'test',officerName:'Tester'});
 assert.equal(s.getFirById(primary.id).linkedFirsList[0].firId,one.id);
 assert.ok(s.getFirById(one.id).linkedFirsList.some(l=>l.firId===primary.id));
 assert.equal(s.getFirById(two.id).linkedFirsList.length,0);
});
