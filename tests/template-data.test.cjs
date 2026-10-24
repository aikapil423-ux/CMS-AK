const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the production pure functions without loading the Next/React UI.
function productionFunction(file, name) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const fn = source.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name);
  assert.ok(fn, `${name} exists`);
  const js = ts.transpile(fn.getText(source).replace(/^export /, ''), { target: ts.ScriptTarget.ES2020 });
  return vm.runInNewContext(`${js}; ${name}`, { formatDate: value => String(value), Date });
}

const enquiry = productionFunction('src/services/builderService.ts', 'resolveDynamicPlaceholders');
const fir = productionFunction('src/app/fir-workspace/builder/page.tsx', 'resolveFIRPlaceholders');
const blankNotice = productionFunction('src/app/fir-workspace/templates/page.tsx', 'emptyNoticeTemplate');

test('missing case facts never produce example identities or sections', () => {
  assert.equal(enquiry('{{ACCUSED_NAME}}|{{WITNESS_NAME}}|{{SECTIONS_OF_LAW}}', {}), '||');
  assert.equal(fir('{{COMPLAINANT_NAME}}|{{WITNESS_NAME}}|{{OFFICER_NAME}}|{{GD_ENTRY_NUMBER}}', {}), '|||');
});

test('same reusable definition resolves independently for two cases', () => {
  const raw = '{{CASE_NUMBER}}|{{COMPLAINANT_NAME}}|{{ACCUSED_NAME}}';
  assert.equal(enquiry(raw, { complaintNumber: 'A', complainantName: 'Alice', accusedList: [{name:'Alpha'}] }), 'A|Alice|Alpha');
  assert.equal(enquiry(raw, { complaintNumber: 'B', complainantName: 'Bob', accusedList: [{name:'Beta'}] }), 'B|Bob|Beta');
  assert.equal(raw, '{{CASE_NUMBER}}|{{COMPLAINANT_NAME}}|{{ACCUSED_NAME}}');
});

test('selected witness is used without changing the case complainant', () => {
  assert.equal(enquiry('{{COMPLAINANT_NAME}}|{{WITNESS_NAME}}', {complainantName:'Alice'}, undefined, {role:'Witness',name:'Bob'}), 'Alice|Bob');
});

test('case text is escaped and dollar sequences remain literal', () => {
  assert.equal(fir('{{COMPLAINANT_NAME}}', {complainantName:'<b>A & $&</b>'}), '&lt;b&gt;A &amp; $&amp;&lt;/b&gt;');
});

test('notice boilerplate cannot introduce sample identity or eligibility', () => {
  const actual = blankNotice({docTitle:'Notice', noticeeName:'Sample', accusedAadhaar:'123', shoEmail:'sample@example.com', natgridHeinousCrime:true, noticeeDob:'1988', documentsRequired:'Sample passport', natgridOtherInfo:'Sample vehicle'});
  assert.equal(actual.docTitle, 'Notice');
  for (const key of ['noticeeName','accusedAadhaar','shoEmail','noticeeDob','documentsRequired','natgridOtherInfo']) assert.equal(actual[key], '');
  assert.equal(actual.natgridHeinousCrime, false);
});

function templateSaveHarness(id, fail = false) {
  const file = 'src/app/fir-workspace/builder/page.tsx';
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'handleSaveTemplateSubmit') handler = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(source);
  const calls = [];
  const context = {
    saveModalName: 'Reusable notice', saveModalCategory: 'Notice', saveModalDesc: '',
    editorRef: {current:{innerHTML:'<p>{{FIR_NUMBER}}</p>'}}, rawTemplateRef: {current:''},
    operatorReceiptRef: {current: undefined},
    editingDefinition: true, currentTemplateId: id, currentUser:{id:'io',name:'Officer',rankDisplay:'SI'},
    savedTemplates: [], FIR_CUSTOM_TEMPLATES_STORAGE_KEY: 'test-only',
    localStorage: {setItem() {}}, loadSavedTemplates: async () => {}, alert: () => {},
    BuilderService: {
      createTemplate: async data => { calls.push(['create',data]); if(fail) throw Error('offline'); return {id:'server-1'}; },
      updateTemplate: async (key,data) => { calls.push(['update',key,data]); if(fail) throw Error('offline'); return {id:key}; },
    },
  };
  for (const setter of ['setDocName','setDocCategory','setDocDescription','setCurrentTemplateId','setSaveStatus','setLastSavedAt','setHasUnsavedChanges','setSaveModalOpen']) context[setter] = value => calls.push([setter,value]);
  const js = ts.transpile(`const run = ${handler.getText(source)};`, {target:ts.ScriptTarget.ES2020});
  return {run:vm.runInNewContext(`${js}; run`,context),calls};
}

test('existing reusable template updates its server ID instead of creating a duplicate', async () => {
  const {run,calls} = templateSaveHarness('server-1');
  await run();
  assert.equal(calls[0][0], 'update');
  assert.equal(calls[0][1], 'server-1');
  assert.equal(calls[0][2].content, '<p>{{FIR_NUMBER}}</p>');
  assert.ok(!calls.some(c => c[0] === 'create'));
});

test('failed template save never reports saved or discards edits', async () => {
  const {run,calls} = templateSaveHarness('std_notice', true);
  await run();
  assert.ok(calls.some(c => c[0] === 'setSaveStatus' && c[1].startsWith('Save failed')));
  assert.ok(!calls.some(c => c[0] === 'setHasUnsavedChanges' && c[1] === false));
  assert.ok(!calls.some(c => c[0] === 'setSaveModalOpen' && c[1] === false));
});
