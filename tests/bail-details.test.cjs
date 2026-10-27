const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const {DatabaseSync}=require('node:sqlite');const {PrismaClient}=require('@prisma/client');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cms-bail-'));const dbPath=path.join(dir,'test.db');const db=new DatabaseSync(dbPath);db.exec(fs.readFileSync('prisma/bail-details.sqlite.sql','utf8'));db.close();
const prisma=new PrismaClient({datasources:{db:{url:`file:${dbPath.replaceAll('\\','/')}`}}});
const modules=new Map();function load(file){if(modules.has(file))return modules.get(file);const exports={};modules.set(file,exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Date,console,require(n){if(n==='@/lib/prisma')return {prisma};if(n.startsWith('@/'))return load(`src/${n.slice(2)}.ts`);return require(n);}});return exports;}
const {bailSchema,emptyBail}=load('src/lib/bailSchema.ts');const {bailDbService:s}=load('src/services/bailDbService.ts');
function input(){return {id:'b8a70ad2-135d-47f1-9db5-799bb78b0db7',expectedVersion:0,firId:'test-fir',policeStation:'Test PS',district:'Test',authorId:'test-io',firSnapshot:{policeStation:'Test PS',district:'Test',assignedIoId:'test-io'},data:{...emptyBail(),accusedId:'acc1',accusedName:'Accused',advocateName:'Advocate',courtType:'Sessions Court',bailType:'Regular',hearingDate:'2026-10-29',suretyType:'Unknown',sameAddress:true,presentAddress:{...emptyBail().presentAddress,city:'Panipat',state:'Haryana',district:'Panipat'},attachment:{name:'order.pdf',type:'application/pdf',data:'data:application/pdf;base64,JVBERi0xLjQ='}}};}
test('required fields and invalid dates are rejected without exceptions',()=>{
 assert.equal(bailSchema.safeParse(emptyBail()).success,false);
 const body=input();body.data.hearingDate='2026-02-30';assert.equal(bailSchema.safeParse(body.data).success,false);
 body.data.hearingDate='2026-99-99';assert.equal(bailSchema.safeParse(body.data).success,false);
 body.data.hearingDate='2026-10-29';body.data.suretyType='Known';assert.equal(bailSchema.safeParse(body.data).success,false);
});
test('backend saves, reloads attachment and surety, retries idempotently and prevents stale edits',async()=>{
 const body=input();const saved=await s.save(body);assert.equal(saved.version,1);assert.equal((await s.save(body)).id,saved.id);assert.equal(await prisma.firBailDetail.count(),1);
 const [loaded]=await s.list(body.firId);assert.equal(loaded.data.attachment.data,body.data.attachment.data);assert.deepEqual(loaded.data.permanentAddress,loaded.data.presentAddress);
 const edited=await s.save({...body,expectedVersion:1,data:{...body.data,advocateName:'Changed'}});assert.equal(edited.version,2);
 await assert.rejects(s.save({...body,expectedVersion:1}),/changed/);
 await assert.rejects(s.save({...body,expectedVersion:2,firId:'another'}),/another FIR/);
 const fresh=new PrismaClient({datasources:{db:{url:`file:${dbPath.replaceAll('\\','/')}`}}});assert.equal((await fresh.firBailDetail.findUnique({where:{id:body.id}})).version,2);await fresh.$disconnect();
});
test('every personal, age, phone and address field survives a backend round trip',async()=>{
 const body=input();body.id='b8a70ad2-135d-47f1-9db5-799bb78b0db8';
 Object.assign(body.data,{suretyType:'Known',uid:'TEST-UID',firstName:'Test',middleName:'Middle',lastName:'Surety',alias:'Alias',gender:'Male',relativeType:'Father',relativeName:'Test Relative',idType:'Passport',idNumber:'TEST123',occupation:'Business',mobileCountryCode:'91',mobile:'9999999999',landlineCountryCode:'91',landlineAreaCode:'180',landline:'1234567',email:'test@example.com',dob:'1990-01-02',birthYear:'1990',ageYears:'36',ageMonths:'9',ageFrom:'35',ageTo:'40',sameAddress:false});
 body.data.presentAddress={houseNo:'1',street:'Test Street',locality:'Test Area',city:'Panipat',tehsil:'Panipat',country:'INDIA',state:'Haryana',district:'Panipat',policeStation:'PS City Panipat',pincode:'132103'};
 body.data.permanentAddress={...body.data.presentAddress,houseNo:'2'};
 const saved=await s.save(body);assert.deepEqual(JSON.parse(JSON.stringify(saved.data)),JSON.parse(JSON.stringify(body.data)));
 const loaded=(await s.list(body.firId)).find(r=>r.id===saved.id);assert.deepEqual(JSON.parse(JSON.stringify(loaded.data)),JSON.parse(JSON.stringify(body.data)));
});
after(async()=>{await prisma.$disconnect();fs.rmSync(dir,{recursive:true,force:true});});
