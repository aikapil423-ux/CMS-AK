const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),ts=require('typescript');
function loader(stubs={},extra={}) {
 const cache={};return function load(file){if(cache[file])return cache[file];const exports={};cache[file]=exports;
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,resolveJsonModule:true}}).outputText,{exports,process,console,Response,...extra,require(n){if(n in stubs)return stubs[n];if(n.endsWith('.json'))return JSON.parse(fs.readFileSync(path.resolve(path.dirname(file),n),'utf8'));if(n.startsWith('@/'))return load('src/'+n.slice(2)+'.ts');return require(n);}}, {filename:file});return exports;};
}
const load=loader(),lib=load('src/lib/weeklyDiary.ts'),engine=load('src/lib/weeklyDiaryEngine.ts');
const fir=(id,other={})=>({id,firNumber:id,firDate:'2026-06-01',firYear:2026,policeStation:'P',district:'D',status:'UNDER_INVESTIGATION',accusedList:[],createdAt:'2026-06-01',...other});
const build=(firs=[],other={})=>engine.buildWeeklyDiary({from:'2026-06-20',to:'2026-06-26',station:'P',firs,complaints:[],evidence:[],...other});
test('22 sheets preserve workbook order and contain headers, not sample case data',()=>{
 const names=lib.WEEKLY_TEMPLATE.sheets.map(s=>s.name);
 assert.equal(names.length,22);assert.equal(names[0],'Performa');assert.equal(names[21],'DATE WISE PART B');
 assert.equal(new Set(names).size,22);
 const source=fs.readFileSync('src/lib/weeklyDiaryTemplate.json','utf8');
 assert.doesNotMatch(source,/PSI DEEPAK KUMAR|HC RAVIT RAMAN|HC PUNIT|7206594211|15,52,000|8950100034|शिकायतकर्ता -/);
 for(const sheet of lib.WEEKLY_TEMPLATE.sheets)for(const part of sheet.parts)if(part.kind==='data')for(const cell of part.template.cells){assert.equal(cell.label,'');assert.equal(cell.editable,true);}
 assert.equal(lib.validDiaryPeriod('2026-06-20','2026-06-26'),true);assert.equal(lib.validDiaryPeriod('2026-02-30','2026-06-26'),false);assert.equal(lib.validDiaryPeriod('2026-06-27','2026-06-26'),false);
});
test('weekly events use inclusive Indian calendar boundaries; pending snapshots use To date',()=>{
 const p=build([fir('old',{firDate:'2024-06-01',accusedList:[{name:'Start',isArrested:true,arrestDate:'2026-06-19T18:30:00Z'},{name:'End',isArrested:true,arrestDate:'2026-06-26T18:29:59Z'},{name:'After',isArrested:true,arrestDate:'2026-06-26T18:30:00Z'}]}),fir('future',{firDate:'2026-06-27'})]);
 assert.equal(p.blocks.arrests.length,2);assert.equal(p.blocks['uiA:over2'].length,1);assert.equal(p.blocks['uiA:over2'][0]['2'].value,'old');
 assert.equal(p.blocks.dateA.length,1);assert.equal(p.blocks.amountA.length,1);
 assert.equal(p.fixed['Index!15:3'].value,'2');
});
test('untraced preparation is not dispatch or court submission; partial and reopened are separate',()=>{
 const p=build([fir('UT',{status:'UNTRACED',finalFormDate:'2026-06-25'}),fir('partial',{status:'PARTIAL_CHARGESHEET',finalFormDate:'2026-06-22'}),fir('reopen',{reopenEvents:[{reopenedAt:'2026-06-21',reason:'Court ordered further investigation',courtName:'Court',orderNumber:'Order-1'}]})]);
 assert.equal(p.blocks.untraced.length,1);assert.equal(p.blocks.dispatch,undefined);assert.equal(p.blocks.courtSubmission,undefined);
 assert.equal(p.fixed['Index!22:3'].value,'1');assert.equal(p.fixed['Index!23:3'].value,'1');assert.equal(p.blocks.dateA,undefined);
 assert.equal(p.blocks.dateB.length,2);assert.match(p.blocks['reopenedB:other'][0]['8'].value,/Order-1/);
});
test('missing historical state and undated arrests do not become invented events',()=>{
 const p=build([fir('changed',{updatedAt:'2026-07-01'}),fir('undated',{accusedList:[{name:'A',isArrested:true}]})]);
 assert.equal(p.blocks.arrests,undefined);assert.equal(p.blocks.dateA.length,1);assert.equal(p.blocks.dateA[0]['10'],undefined);
 assert.ok(p.warnings.some(w=>w.includes('historical status')));assert.ok(p.warnings.some(w=>w.includes('no date')));
 assert.equal(p.fixed['Index!15:3'],undefined);
});
test('only quote-verified dated processed events fill report tables',()=>{
 const evidence={caseId:'f1',processingStatus:'COMPLETED',rawDocument:{fileName:'Evidence'},extractedText:'A was arrested on 21 June.',structuredData:{investigation:{entities:[{id:'a',primaryName:'A'}],events:[{type:'ARREST',date:'2026-06-21',time:'12:00',title:'Arrest',participantEntityIds:['a'],source:{verification:'MATCHED_TEXT',verbatimQuote:'A was arrested on 21 June.'}},{type:'RECOVERY',date:'2026-06-21',participantEntityIds:[],source:{verification:'MATCHED_TEXT',verbatimQuote:'invented quote'}}]}}};
 const p=build([fir('f1')],{evidence:[evidence]});assert.equal(p.blocks.arrests.length,1);assert.equal(p.blocks.arrests[0]['5'].value,'A');assert.equal(p.blocks.recovery,undefined);assert.match(p.blocks.arrests[0]['5'].source,/Processed: Evidence/);
});
test('manual notes follow their case after a sorted row moves',()=>{
 const old=build([fir('a',{totalPropertyEstimatedValue:10}),fir('b',{totalPropertyEstimatedValue:20})]);
 old.overrides[lib.dataKey('AMOUNT WISE','amountA',0,14)]={value:'Note for B',origin:'MANUAL',source:'Officer edit'};
 const next=build([fir('a',{totalPropertyEstimatedValue:30}),fir('b',{totalPropertyEstimatedValue:20})]);
 const rebased=lib.rebaseDiaryOverrides(old,next);assert.equal(rebased[lib.dataKey('AMOUNT WISE','amountA',1,14)].value,'Note for B');
 assert.equal(lib.validDiaryKey('AMOUNT WISE!amountA:1:14'),true);assert.equal(lib.validDiaryKey('unknown!1:1'),false);
});
test('backend diary persistence isolates periods/owners and rejects stale saves',async()=>{
 const dir=await fsp.mkdtemp(path.join(os.tmpdir(),'cms-weekly-test-'));
 try{const repo=loader({}, {process:{cwd:()=>dir}})('src/services/weeklyDiaryRepository.ts');
 const first=await repo.saveDiary('owner',build([fir('a')]),null);
 assert.equal(await repo.readDiary('other',first.from,first.to,first.station),null);
 assert.equal(await repo.readDiary('owner','2026-06-19',first.to,first.station),null);
 assert.equal((await repo.readDiary('owner',first.from,first.to,first.station)).blocks.dateA[0]['2'].value,'a');
 await repo.saveDiary('owner',first,first.revision);await assert.rejects(repo.saveDiary('owner',first,first.revision),/changed/);
 }finally{await fsp.rm(dir,{recursive:true,force:true});}
});
test('original calculation locations recalculate after input edits and preserve zero vs blank',()=>{
 const {calculateDiary,diaryFormula}=load('src/lib/weeklyDiaryCalculations.ts');
 const p=build();
 for(const [key,value] of Object.entries({'Performa!20:3':'47','Performa!20:4':'63','Performa!20:5':'117','Performa!21:5':'100','Performa!22:5':'64'}))p.fixed[key]={value,origin:'AUTO',source:'test'};
 let result=calculateDiary(p);
 assert.equal(result.fixed['Performa!20:6'].value,'101');assert.equal(result.fixed['Performa!21:7'].value,'0.9901');assert.equal(result.fixed['Performa!22:7'].value,'0.6337');
 result=calculateDiary(p,{'Performa!20:3':'48'});assert.equal(result.fixed['Performa!20:6'].value,'102');
 result=calculateDiary(p,{'Performa!20:3':''});assert.equal(result.fixed['Performa!20:6'],undefined);
 assert.equal(diaryFormula('Performa!20:6'),'C20+(E20-D20)');
 assert.equal(lib.validDiaryKey('AMOUNT WISE!amountA:10000:14'),true);
 const edits={};for(let c=3;c<=24;c++)edits[lib.dataKey('PARCHA-12','parcha',0,c)]='0';edits[lib.dataKey('PARCHA-12','parcha',0,3)]='53';
 result=calculateDiary(p,edits);assert.equal(result.blocks.parcha[0]['25'].value,'53');
 delete edits[lib.dataKey('PARCHA-12','parcha',0,4)];assert.equal(calculateDiary(p,edits).blocks.parcha[0]['25'],undefined);
});
test('authoritative dated challan records fill partial/checking/court stages independently',()=>{
 const p=build([fir('p',{trackingState:'PART_B_PARTIAL',challanRecords:[{id:'ch',challanMode:'PARTIAL',issuedAt:'2026-06-21',submittedToCourt:true,courtSubmittedAt:'2026-06-24',courtName:'Court',courtReceiptNo:'R-1'}]}),fir('checking',{challanRecords:[{id:'ch2',challanMode:'COMPLETE',issuedAt:'2026-06-22',submittedToCourt:false}]})]);
 assert.equal(p.blocks.partial.length,1);assert.equal(p.blocks.checking.length,1);assert.equal(p.blocks.courtSubmission.length,1);assert.equal(p.blocks.courtSubmission[0]['8'].value,'R-1');assert.equal(p.blocks.dateA,undefined);
});
test('cell sizes, added fields and row deletion persist without modifying the source template',()=>{
 const {validateDiaryLayout,rebaseDiaryLayout}=load('src/lib/weeklyDiaryLayout.ts');
 const base=JSON.stringify(lib.WEEKLY_TEMPLATE),layout=lib.emptyDiaryLayout();
 layout.labels['Index!3:3']='Edited heading';layout.cellFormats['Index!3:3']={bold:true,italic:true,align:'center',fontSize:14};layout.columnWidths['Index:3']=300;layout.rowHeights['Index!3']=80;
 layout.fieldSizes['AMOUNT WISE!amountA:0:14']={width:240,height:100};
 layout.extraFields['Index!3:3']=[{id:'field-1',label:'New field',value:'Officer input'}];
 layout.extraRows['amountA']=1001;layout.hiddenRows=['AMOUNT WISE!amountA:0'];
 layout.customRows.Index=[{id:'row-1',cells:[{value:'Extra',width:100,height:40},{value:'Description',width:200,height:40},{value:'Value',width:100,height:40}]}];
 const checked=validateDiaryLayout(layout);assert.equal(checked.labels['Index!3:3'],'Edited heading');assert.equal(checked.cellFormats['Index!3:3'].fontSize,14);assert.throws(()=>validateDiaryLayout({...layout,cellFormats:{'Index!3:3':{fontSize:100}}}),/Invalid cell format/);assert.equal(checked.rowHeights['Index!3'],80);
 const old=build([fir('a',{totalPropertyEstimatedValue:10}),fir('b',{totalPropertyEstimatedValue:20})]);old.layout=checked;
 const next=build([fir('a',{totalPropertyEstimatedValue:30}),fir('b',{totalPropertyEstimatedValue:20})]);
 const moved=rebaseDiaryLayout(old,next);assert.equal(moved.fieldSizes['AMOUNT WISE!amountA:1:14'].height,100);assert.equal(moved.hiddenRows[0],'AMOUNT WISE!amountA:1');assert.equal(moved.extraRows.amountA,1001);
 assert.equal(JSON.stringify(lib.WEEKLY_TEMPLATE),base);
 assert.equal(checked.customRows.Index[0].cells[1].value,'Description');
 assert.throws(()=>validateDiaryLayout({...layout,columnWidths:{'unknown:1':100}}),/Invalid column/);
});
test('API excludes unauthorized source records and rejects a foreign police station',async()=>{
 let persisted;
 const route=loader({
  '@/lib/apiSecurity':{apiAccess:()=>({id:'user',role:'SHO',stationName:'P',district:'D'})},
  '@/lib/firIntegrity':{isFirVisibleToUser:(user,f)=>f.id==='allowed'},
  '@/utils/complaintPermissions':{canViewComplaint:()=>({allowed:false})},
  '@/services/firRepository':{readFirRecords:async()=>[fir('allowed'),fir('foreign',{policeStation:'Foreign'})]},
  '@/services/complaintRepository':{readComplaints:async()=>[]},
  '@/services/weeklyDiaryRepository':{readDiary:async()=>null,saveDiary:async(owner,packet)=>(persisted=packet)},
  '@/lib/evidenceOwnership':{evidenceOwner:e=>e.ownerId},
  'node:fs/promises':{readFile:async()=>JSON.stringify([])},
 })('src/app/api/reports/weekly-diary/route.ts');
 const meta=await (await route.GET({})).json();assert.deepEqual(meta.stations,['P']);
 const denied=await route.POST({json:async()=>({action:'build',from:'2026-06-20',to:'2026-06-26',station:'Foreign'})});assert.equal(denied.status,403);
 const result=await route.POST({json:async()=>({action:'build',from:'2026-06-20',to:'2026-06-26',station:'P'})});assert.equal(result.status,200);assert.equal(persisted.blocks.dateA[0]['2'].value,'allowed');
});
test('UI wires cell resizing, adding/removing fields and rows into Save All Sheets',async()=>{
 const React=require('react'),state=[];let cursor=0,saved;class Textarea {}
 const initial=build();
 const hooks={...React,useState(value){const i=cursor++;if(!(i in state)){state[i]=typeof value==='function'?value():value;if(i===0)state[i]=initial.from;if(i===1)state[i]=initial.to;if(i===3)state[i]='P';if(i===4)state[i]='RC';if(i===5)state[i]=initial;if(i===17)state[i]=JSON.stringify([initial.from,initial.to,'P',0]);}return [state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},useRef:value=>({current:value}),useEffect(){}};
 const view=loader({'react':hooks,'@/context/AuthContext':{useAuth:()=>({currentUser:{id:'u',stationName:'P'}})},'@/utils/printElement':{printA4Element(){}}},
 {HTMLTextAreaElement:Textarea,prompt:()=> 'New notes',confirm:()=>true,crypto:{randomUUID:()=> 'custom-id'},fetch:async(url,options)=>{saved=JSON.parse(options.body);return {ok:true,json:async()=>({packet:{...initial,layout:saved.layout,overrides:{}}})};}})('src/components/reports/WeeklyDiaryWorkbook.tsx');
 function nodes(node){if(Array.isArray(node))return node.flatMap(nodes);if(!node||typeof node!=='object')return [];return [node,...nodes(node.props?.children)];}
 function text(node){if(Array.isArray(node))return node.map(text).join('');return node&&typeof node==='object'?text(node.props?.children):node==null?'':String(node);}
 const render=()=>{cursor=0;return view.WeeklyDiaryWorkbook();};
 let tree=render();const pasteTarget=new Textarea();pasteTarget.dataset={diaryField:'RC!dispatch:0:2'};let prevented=false;
 nodes(tree).find(e=>e.props?.onPaste).props.onPaste({target:pasteTarget,clipboardData:{getData:type=>type==='text/plain'?'FIR-X\t2026-06-22\nFIR-Y\t2026-06-23':''},preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(state[6]['RC!dispatch:1:2'],'FIR-Y');assert.equal(state[14].extraRows.dispatch,2);
 tree=render();nodes(tree).find(e=>e.type==='button'&&text(e)==='Undo').props.onClick();tree=render();assert.equal(Object.keys(state[6]).length,0);assert.equal(state[14].extraRows.dispatch,undefined);
 const headerCell=nodes(tree).find(e=>e.type==='td'&&e.props.onClick&&nodes(e).some(c=>typeof c.type==='function'&&c.type.name==='DiaryResizeHandles'&&c.props.info.table&&c.props.info.keys.length>2));
 assert.ok(headerCell);headerCell.props.onClick();tree=render();
 nodes(tree).find(e=>e.props?.['aria-label']==='Column width').props.onChange({target:{value:'100'}});tree=render();
 assert.ok(Object.keys(state[14].tableWidths).length>2);
 const sizedRows=nodes(tree).filter(e=>e.type==='table'&&e.props['data-diary-row']&&nodes(e).some(c=>c.props?.['data-diary-field']==='RC!dispatch:0:2'));
 assert.ok(sizedRows.length);const bodyWidths=nodes(sizedRows[0]).filter(e=>e.type==='col').map(e=>e.props.style.width);
 assert.ok(bodyWidths.length>2);
 const headerRowKey='RC!'+nodes(headerCell).find(c=>typeof c.type==='function'&&c.type.name==='DiaryResizeHandles').props.info.table.header;
 const headerTable=nodes(tree).find(e=>e.type==='table'&&e.props['data-diary-row']===headerRowKey);
 assert.deepEqual(nodes(headerTable).filter(e=>e.type==='col').map(e=>e.props.style.width),bodyWidths);
 assert.ok(Object.keys(load('src/lib/weeklyDiaryLayout.ts').validateDiaryLayout(state[14]).tableWidths).length>2);
 nodes(tree).find(e=>e.type==='button'&&text(e)==='Undo').props.onClick();tree=render();assert.equal(Object.keys(state[14].tableWidths).length,0);
 const cell=nodes(tree).find(e=>e.type==='td'&&e.props.onClick&&nodes(e).some(c=>c.props?.['data-diary-field']==='RC!dispatch:0:2'));assert.ok(cell);cell.props.onClick();
 tree=render();nodes(tree).find(e=>e.props?.['aria-label']==='Column width').props.onChange({target:{value:'320'}});
 tree=render();
 const resizedCell=nodes(tree).find(e=>e.type==='td'&&e.props.onClick&&nodes(e).some(c=>c.props?.['data-diary-field']==='RC!dispatch:0:2'));
 const resizeComponent=nodes(resizedCell).find(e=>typeof e.type==='function'&&e.type.name==='DiaryResizeHandles');assert.ok(resizeComponent);
 const buttons=nodes(resizeComponent.type(resizeComponent.props));
 const target={closest:name=>({getBoundingClientRect:()=>name==='table'?{width:load('src/lib/weeklyDiaryGeometry.ts').diaryContentPixels(7)}:{height:40}}),setPointerCapture(){},hasPointerCapture:()=>false,releasePointerCapture(){}};
 const event=(x,y)=>({clientX:x,clientY:y,pointerId:1,currentTarget:target,preventDefault(){},stopPropagation(){}});
 const xHandle=buttons.find(e=>e.props?.['aria-label']==='Drag cell width');xHandle.props.onPointerDown(event(100,100));xHandle.props.onPointerMove(event(180,100));xHandle.props.onPointerUp(event(180,100));
 const yHandle=buttons.find(e=>e.props?.['aria-label']==='Drag row height');yHandle.props.onPointerDown(event(100,100));yHandle.props.onPointerMove(event(100,150));yHandle.props.onPointerUp(event(100,150));
 tree=render();nodes(tree).find(e=>e.type==='button'&&text(e)==='Bold').props.onClick();
 tree=render();assert.equal(state[14].cellFormats['RC!dispatch:0:2'].bold,true);
 nodes(tree).find(e=>e.type==='button'&&text(e)==='Undo').props.onClick();
 tree=render();assert.equal(state[14].cellFormats['RC!dispatch:0:2'],undefined);
 nodes(tree).find(e=>e.type==='button'&&text(e)==='Redo').props.onClick();
 tree=render();nodes(tree).find(e=>e.props?.['aria-label']==='Cell alignment').props.onChange({target:{value:'right'}});
 tree=render();assert.equal(state[14].cellFormats['RC!dispatch:0:2'].align,'right');
 tree=render();nodes(tree).find(e=>e.type==='button'&&text(e)==='+ Add Field').props.onClick();
 tree=render();assert.ok(nodes(tree).some(e=>e.props?.['aria-label']==='New notes'));
 nodes(tree).find(e=>e.type==='button'&&text(e)==='Remove Field').props.onClick();
 tree=render();nodes(tree).find(e=>e.type==='button'&&text(e).includes('+ Add Row · Table 1')).props.onClick();
 tree=render();nodes(tree).find(e=>e.type==='button'&&text(e)==='+ Add Blank Row').props.onClick();
 tree=render();await nodes(tree).find(e=>e.type==='button'&&text(e)==='Save All Sheets').props.onClick();
 assert.equal(saved.layout.columnWidths['RC:2'],undefined);assert.ok(Math.abs(saved.layout.cellWidths['RC!dispatch:0:2']*load('src/lib/weeklyDiaryGeometry.ts').diaryContentPixels(7)/100-400)<0.001);assert.ok(Object.keys(saved.layout.cellWidths).every(k=>k.startsWith('RC!dispatch:0:')));assert.equal(saved.layout.rowHeights['RC!dispatch:0'],90);assert.equal(Object.keys(saved.layout.rowHeights).length,1);assert.equal(saved.layout.extraFields['RC!dispatch:0:2'][0].label,'New notes');assert.ok(saved.layout.hiddenFields.includes('RC!dispatch:0:2'));assert.equal(saved.layout.extraRows.dispatch,2);assert.equal(saved.layout.customRows.RC.length,1);
});

test('row resizing stays within printable width and leaves input weights unchanged',()=>{
 const {fitDiaryRow,diaryContentPixels,diaryRowPercents}=load('src/lib/weeklyDiaryGeometry.ts');
 const weights=[80,150,200,120,168],original=[...weights],total=diaryContentPixels(9);
 for(let cell=0;cell<weights.length;cell++)for(const requested of [-100,20,100,2000]){
  const fitted=fitDiaryRow(weights,cell,requested,total);
  assert.ok(Math.abs(fitted.reduce((a,b)=>a+b,0)-total)<1e-7);
  assert.ok(fitted.every(w=>w>=20-1e-7));assert.ok(fitted[cell]<=total-20*(weights.length-1)+1e-7);
  assert.ok(Math.abs(diaryRowPercents(fitted).reduce((a,b)=>a+b,0)-100)<1e-7);
 }
 assert.deepEqual(weights,original);
});

test('diary dates reject future days using the Indian calendar boundary',()=>{
 assert.equal(lib.diaryToday(new Date('2026-11-05T18:29:59Z')),'2026-11-05');
 assert.equal(lib.diaryToday(new Date('2026-11-05T18:30:00Z')),'2026-11-06');
 assert.equal(lib.validDiaryPeriod('2026-11-01','2026-11-05','2026-11-05'),true);
 assert.equal(lib.validDiaryPeriod('2026-11-01','2026-11-06','2026-11-05'),false);
 assert.equal(lib.validDiaryPeriod('2026-11-06','2026-11-07','2026-11-05'),false);
});
