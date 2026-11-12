const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),crypto=require('node:crypto');
const modules=new Map();let dbQueries=0,dbUser=null,dbUnavailable=false;
const process_={...process,env:{...process.env,NODE_ENV:'test',CMS_SESSION_SECRET:'test-secret-'.repeat(4)}};
for(const key of ['ENABLE_DEMO_LOGIN','NEXT_PUBLIC_ENABLE_DEMO_LOGIN','CMS_DEVELOPER_ADMIN_PASSWORD','DISABLE_DEMO_LOGIN'])delete process_.env[key];
function load(file){
  if(modules.has(file))return modules.get(file);
  const exports={};modules.set(file,exports);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInNewContext(code,{exports,console,Date,Intl,Buffer,URL,Request,Response,structuredClone,globalThis:{},process:process_,setTimeout,queueMicrotask,require(n){
    if(n==='@/lib/prisma')return {prisma:{
      user:{findUnique:async({where})=>{
        dbQueries++;
        if(dbUnavailable)throw new Error('database unavailable');
        if(!dbUser)return null;
        return (where.id===dbUser.id || where.pno===dbUser.pno) ? dbUser : null;
      }},
      policeUnit:{findMany:async()=>[]},
    }};
    if(n==='@/lib/mockData')return load('src/lib/mockData.ts');
    if(n==='./mockData')return load('src/lib/mockData.ts');
    if(n.startsWith('@/')){const f='src/'+n.slice(2);return load(fs.existsSync(f+'.ts')?f+'.ts':f+'/index.ts');}
    if(n.startsWith('.'))return load(path.join(path.dirname(file),n+'.ts'));
    return require(n);
  }});
  return exports;
}
const {DEMO_USERS}=load('src/lib/mockData.ts');
const {validLogin,sessionUser,sessionPrincipal,issueSession,demoEnabled}=load('src/lib/serverSession.ts');
const officer=(pno,pin)=>({
  id:'usr_real_1',pno,fullName:'Real Officer',rank:'SHO',role:'SHO',status:'ACTIVE',
  passwordHash:'test-salt:'+crypto.scryptSync(pin,'test-salt',64).toString('hex'),
  unit:{id:'unit-real',code:'REAL-01',name:'PS Test',district:'Panipat'},
});

test('demo login returns before touching the database, so an unseeded or unreachable database cannot break it',async()=>{
  process_.env.NODE_ENV='test';dbUser=null;dbUnavailable=true;
  const demo=DEMO_USERS[0];const before=dbQueries;
  const user=await validLogin(demo.pno,'123456');
  assert.equal(user.id,demo.id);assert.equal(dbQueries,before);
  dbUnavailable=false;
  assert.equal(await validLogin(demo.pno,'999999'),null);
  assert.equal(dbQueries,before+1);
});

test('demo PIN wins over a database password for the same PNO and the real password still works',async()=>{
  process_.env.NODE_ENV='test';dbUnavailable=false;
  const demo=DEMO_USERS[0];dbUser=officer(demo.pno,'real-pin');
  assert.equal((await validLogin(demo.pno,'123456')).id,demo.id);
  const real=await validLogin(demo.pno,'real-pin');
  assert.equal(real.id,'usr_real_1');assert.equal(real.stationName,'PS Test');
  assert.equal(await validLogin(demo.pno,'bad-pin'),null);
});

test('demo mode enabled on a production build still logs demo users in without a database',async()=>{
  process_.env.NODE_ENV='production';process_.env.ENABLE_DEMO_LOGIN='true';dbUser=null;dbUnavailable=true;
  assert.equal(demoEnabled(),true);
  const demo=DEMO_USERS[1];const before=dbQueries;
  assert.equal((await validLogin(demo.pno,'123456')).id,demo.id);
  assert.equal(dbQueries,before);
  assert.equal((await sessionUser(new Request('http://local',{headers:{cookie:'cms_session='+issueSession(demo.id,undefined,true)}}))).id,demo.id);
  delete process_.env.ENABLE_DEMO_LOGIN;
});

test('an opted-out deployment rejects the demo PIN and demo sessions',async()=>{
  process_.env.NODE_ENV='production';delete process_.env.ENABLE_DEMO_LOGIN;process_.env.DISABLE_DEMO_LOGIN='true';dbUser=null;dbUnavailable=false;
  assert.equal(demoEnabled(),false);
  const demo=DEMO_USERS[0];
  assert.equal(await validLogin(demo.pno,'123456'),null);
  assert.equal(await sessionUser(new Request('http://local',{headers:{cookie:'cms_session='+issueSession(demo.id,undefined,true)}})),null);
  delete process_.env.DISABLE_DEMO_LOGIN;
  process_.env.NODE_ENV='test';
});

test('view-as resolves the viewed officer from the developer session and falls back safely',async()=>{
  process_.env.NODE_ENV='test';dbUser=null;dbUnavailable=true;
  const developer='cms_developer_admin';
  const sho=DEMO_USERS.find(u=>u.role==='SHO');
  const sp=DEMO_USERS[0];
  // The developer session with a view-as marker resolves to the viewed officer, including the SP.
  const shoView=await sessionUser(new Request('http://local',{headers:{cookie:'cms_session='+issueSession(developer,undefined,false,sho.id)}}));
  assert.equal(shoView.id,sho.id);assert.equal(shoView.stationName,sho.stationName);
  const spView=await sessionUser(new Request('http://local',{headers:{cookie:'cms_session='+issueSession(developer,undefined,false,sp.id)}}));
  assert.equal(spView.id,sp.id);
  // The principal still exposes the real developer session behind the view.
  const principal=await sessionPrincipal(new Request('http://local',{headers:{cookie:'cms_session='+issueSession(developer,undefined,false,sp.id)}}));
  assert.equal(principal.userId,developer);assert.equal(principal.viewAs,sp.id);
  // Unknown targets and the developer identity itself fall back to the developer's own session.
  const fallback=await sessionUser(new Request('http://local',{headers:{cookie:'cms_session='+issueSession(developer,undefined,false,'missing-id')}}));
  assert.equal(fallback.id,developer);
  const self=await sessionUser(new Request('http://local',{headers:{cookie:'cms_session='+issueSession(developer,undefined,false,developer)}}));
  assert.equal(self.id,developer);
  // A non-developer session never gains another identity through a view-as marker.
  const dsp=DEMO_USERS.find(u=>u.role==='DSP_SUBDIV');
  const unaffected=await sessionUser(new Request('http://local',{headers:{cookie:'cms_session='+issueSession(dsp.id,undefined,true,sho.id)}}));
  assert.equal(unaffected.id,dsp.id);
  // Without a marker (after exiting) the developer's own identity returns.
  const exited=await sessionUser(new Request('http://local',{headers:{cookie:'cms_session='+issueSession(developer)}}));
  assert.equal(exited.id,developer);
});
