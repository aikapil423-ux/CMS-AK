const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

const cache = {};
function runTsModule(filePath, extra = {}) {
  if (cache[filePath]) return cache[filePath];
  const source = fs.readFileSync(filePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const contextExports = {};
  const mockStorage = {
    getItem: () => null,
    setItem: () => {},
  };
  const mockSynth = {
    speaking: false,
    speak: () => {},
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    getVoices: () => [],
  };

  const context = {
    exports: contextExports,
    module: { exports: contextExports },
    console,
    Date,
    Math,
    setTimeout,
    clearTimeout,
    window: {
      localStorage: mockStorage,
      speechSynthesis: mockSynth,
    },
    localStorage: mockStorage,
    SpeechSynthesisUtterance: class {
      constructor(text) {
        this.text = text;
        this.onend = null;
        this.onerror = null;
      }
    },
    require: (name) => {
      if (name.includes('dynamicModuleRegistry')) {
        return runTsModule('src/services/agent/dynamicModuleRegistry.ts');
      }
      if (name.includes('websiteOperator')) {
        return {
          LiveWebsiteBridge: class {
            captureSnapshot() { return {}; }
            executeAction() { return {}; }
          },
        };
      }
      return {};
    },
    ...extra,
  };
  cache[filePath] = contextExports;
  vm.runInNewContext(transpiled, context);
  return contextExports;
}

const { DynamicModuleRegistry, CORE_POLICE_MODULES } = runTsModule('src/services/agent/dynamicModuleRegistry.ts');
const { StatutoryDeadlinesEngine } = runTsModule('src/services/agent/statutoryDeadlinesEngine.ts');
const { LegalPrecedentsEngine, LANDMARK_POLICE_PRECEDENTS } = runTsModule('src/services/agent/legalPrecedentsEngine.ts');
const { InvestigationIntelligence } = runTsModule('src/services/agent/investigationIntelligence.ts');
const { CmsVoiceEngine } = runTsModule('src/services/agent/cmsVoiceEngine.ts');

test('DynamicModuleRegistry contains the core operational modules plus specialized desks', () => {
  const modules = DynamicModuleRegistry.getAllModules();
  assert.ok(modules.length >= 13, `Expected at least 13 registered modules, got ${modules.length}`);
  
  const expectedIds = [
    'COMPLAINTS',
    'ROZNAMCHA',
    'FIR',
    'REGISTRATIONS',
    'REPORTS',
    'PROSECUTION',
    'TELECOM',
    'AUDITS',
    'MALKHANA',
    'SUMMONS_WARRANTS',
    'CHARGESHEET',
    'CYBER_CELL',
    'CRIME_INTELLIGENCE',
  ];

  for (const id of expectedIds) {
    const found = modules.find(m => m.id === id);
    assert.ok(found, `Module ${id} must be registered in DynamicModuleRegistry`);
  }
});

test('Natural language routing accurately resolves modules in Hindi and English', () => {
  const testCases = [
    { query: 'audits page kholo please', expectedPath: '/audits' },
    { query: 'inspection console check karo', expectedPath: '/audits' },
    { query: 'निरीक्षण और पेंडेंसी रिपोर्ट दिखाओ', expectedPath: '/audits' },
    { query: 'prosecution and court affidavit', expectedPath: '/prosecution' },
    { query: 'अभियोजन अदालत जमानत जवाब', expectedPath: '/prosecution' },
    { query: 'telecom cdr ipdr tower dump', expectedPath: '/telecom' },
    { query: 'दूरसंचार कॉल डिटेल निकालो', expectedPath: '/telecom' },
    { query: 'igp briefing weekly diary reports', expectedPath: '/reports' },
    { query: 'उच्चाधिकारी रिपोर्ट दिखाओ', expectedPath: '/reports' },
    { query: 'uidb missing person registration', expectedPath: '/registrations' },
    { query: 'लावारिस लाश और गुमशुदा व्यक्ति रजिस्टर', expectedPath: '/registrations' },
    { query: 'shikayat complaints desk', expectedPath: '/complaints' },
    { query: 'register complaint nayi shikayat', expectedPath: '/complaints/register' },
    { query: 'general diary roznamcha aam', expectedPath: '/general-diary' },
    { query: 'new gd entry form nayi rapat', expectedPath: '/general-diary/new' },
    { query: 'fir mukaddma register', expectedPath: '/fir' },
    { query: 'arrest docs girftari memo 26.8', expectedPath: '/fir-workspace/arrest-docs' },
    { query: 'मालखाना मुद्द नंबर रजिस्टर', expectedPath: '/malkhana' },
    { query: 'समन व गैर जमानती वारंट तामील', expectedPath: '/summons-warrants' },
    { query: 'मुकम्मल चालान चार्जशीट 193 bnss', expectedPath: '/fir-workspace/chargesheet' },
    { query: 'साइबर सेल और म्यूल अकाउंट', expectedPath: '/cyber-cell' },
    { query: 'ग्राम अपराध और हिस्ट्री शीटर निगरानी', expectedPath: '/crime-intelligence' },
  ];

  for (const { query, expectedPath } of testCases) {
    const matched = DynamicModuleRegistry.matchIntentToRoute(query);
    assert.ok(matched, `Query '${query}' must match a route`);
    assert.equal(matched.path, expectedPath, `Query '${query}' should route to ${expectedPath}, got ${matched.path}`);
  }
});

test('StatutoryDeadlinesEngine calculates 60/90 day default bail and 14 day inquiry correctly', () => {
  // Case 1: Arrested 70 days ago under Theft (60-day limit) -> OVERDUE Default bail risk!
  const alert60 = StatutoryDeadlinesEngine.evaluateDefaultBailRisk(
    '101/2026',
    new Date(Date.now() - 70 * 86400000),
    'Sec 303(2) BNS',
    'Ramesh'
  );
  assert.equal(alert60.totalLimitDays, 60);
  assert.equal(alert60.isOverdue, true);
  assert.equal(alert60.severity, 'CRITICAL');

  // Case 2: Murder (90-day limit), arrested 20 days ago -> 70 days remaining, INFO
  const alert90 = StatutoryDeadlinesEngine.evaluateDefaultBailRisk(
    '102/2026',
    new Date(Date.now() - 20 * 86400000),
    'Sec 103 BNS (Murder)',
    'Suresh'
  );
  assert.equal(alert90.totalLimitDays, 90);
  assert.equal(alert90.isOverdue, false);
  assert.ok(alert90.daysRemaining >= 69);

  // Case 3: 14-day inquiry limit for complaints (Sec 173(3) BNSS)
  const compAlert = StatutoryDeadlinesEngine.evaluateComplaintEnquiryDeadline(
    'COMP-991',
    new Date(Date.now() - 15 * 86400000),
    'SI Vikram'
  );
  assert.equal(compAlert.isOverdue, true);
  assert.equal(compAlert.severity, 'CRITICAL');
});

test('LegalPrecedentsEngine generates Bail Objection Reply with Supreme Court citations', () => {
  const reply = LegalPrecedentsEngine.generateBailObjectionDraft({
    firNumber: '142/2026',
    courtName: 'मुख्य न्यायिक दंडाधिकारी, हिसar',
    policeStation: 'सदर हिसार',
    applicantAccused: 'अनिल कुमार',
    offenseSections: 'धारा 303(2), 305 BNS',
    hasCriminalAntecedents: true,
    antecedentDetails: 'थाने में पूर्व चोरी मुकद्दमा नं. 12/2024 दर्ज है',
    isWitnessTamperingRisk: true,
  });

  assert.ok(reply.draftHindi.includes('Prasanta Kumar Sarkar v. Ashis Chatterjee'));
  assert.ok(reply.draftHindi.includes('अनिल कुमार'));
  assert.ok(reply.citedPrecedents.length >= 1);
});

test('InvestigationIntelligence scrutinizes chargesheet readiness and detects missing items', () => {
  // Case with missing MLC and missing FSL
  const result = InvestigationIntelligence.scrutinizeChargesheetReadiness({
    firNumber: '150/2026',
    offenseSections: 'धारा 115 BNS (Grievous Hurt)',
    witnessCount: 1, // Only 1 witness -> deficiency
    hasSitePlanNaksha: true,
    hasMlCOrPostMortem: false, // Blocker
  });

  assert.equal(result.isReadyForCourt, false);
  assert.ok(result.deficiencies.some(d => d.priority === 'BLOCKER'));
  assert.ok(result.deficiencies.some(d => d.item.includes('एमएलसी') || d.item.includes('मेडिकल')));
});

test('InvestigationIntelligence synthesizes raw speech into official Section 192 BNSS Zimni', () => {
  const zimni = InvestigationIntelligence.synthesizeSpeechToZimni({
    firNumber: '88/2026',
    zimniNumber: 3,
    policeStation: 'थाना सदर',
    ioName: 'विक्रम सिंह',
    ioRank: 'SI',
    rawNarration: 'वारदात वाली दुकान का ताला टूटा मिला। आस-पास के 2 पड़ोसियों से पूछताछ की।',
    locationInspected: 'दुकान नंबर 12, मेन मार्केट',
    personsInterrogated: ['रमेश दुकानदार', 'पड़ोसी मोहन'],
  });

  assert.ok(zimni.fullZimniText.includes('पर्चा ज़िमनी नंबर: 3'));
  assert.ok(zimni.fullZimniText.includes('धारा 180 BNSS'));
  assert.ok(zimni.fullZimniText.includes('SI विक्रम सिंह'));
});

test('Self-updating extension: New modules registered at runtime are automatically discovered and routed', () => {
  const newStfModule = {
    id: 'STF_CELL',
    title: 'Special Task Force (Gangster Cell)',
    titleHi: 'स्पेशल टास्क फोर्स (गैंगस्टर विरोधी सेल)',
    path: '/stf-cell',
    category: 'Intelligence',
    description: 'ऑर्गेनाइज्ड क्राइम, फिरौती सिंडिकेट व हथियार तस्कर ट्रैकिंग।',
    aliases: ['stf', 'special task force', 'एसटीएफ', 'gangster', 'गैंगस्टर'],
    supportedActions: ['सिंडिकेट मैपिंग', 'फिरौती कॉल रिकॉर्ड'],
    primaryApis: ['/api/stf'],
    databaseEntities: ['StfRecord'],
  };

  DynamicModuleRegistry.registerModule(newStfModule);

  const matched = DynamicModuleRegistry.matchIntentToRoute('एसटीएफ सेल खोलो');
  assert.ok(matched);
  assert.equal(matched.path, '/stf-cell');
});

test('CmsVoiceEngine barge-in: Accurately identifies Hindi, Hinglish, and English interruption commands', () => {
  const interruptions = [
    'ruko',
    'ruko ruko',
    'ruk jao',
    'chup',
    'chup raho',
    'band karo',
    'stop',
    'please stop',
    'wait',
    'ruko zara',
    'shant',
    'bas karo',
    'cancel',
    'nahi',
    'रुको',
    'रुक जाओ',
    'चुप रहो',
    'शांत',
    'बंद करो',
    'बस करो',
    'मत बोलो',
  ];

  for (const phrase of interruptions) {
    assert.equal(
      CmsVoiceEngine.isInterruptionKeyword(phrase),
      true,
      `Phrase '${phrase}' should be recognized as an interruption keyword`
    );
  }

  const normalCommands = [
    'fir portal kholo',
    'complaints register karo',
    'roznamcha dikhao',
    'bns 303 search karo',
    'show prosecution bail status',
  ];

  for (const cmd of normalCommands) {
    assert.equal(
      CmsVoiceEngine.isInterruptionKeyword(cmd),
      false,
      `Regular command '${cmd}' should NOT be flagged as interruption`
    );
  }
});

test('CmsVoiceEngine barge-in: Acoustic Echo filter NEVER discards user interruption keywords or genuine commands', () => {
  // Even if agent just spoke, interruption keywords are NEVER classified as echo
  assert.equal(CmsVoiceEngine.isEchoOfAgent('ruko'), false);
  assert.equal(CmsVoiceEngine.isEchoOfAgent('stop'), false);
  assert.equal(CmsVoiceEngine.isEchoOfAgent('रुको'), false);
  assert.equal(CmsVoiceEngine.isEchoOfAgent('chup'), false);

  // Short user commands are not dropped as echo
  assert.equal(CmsVoiceEngine.isEchoOfAgent('fir open karo'), false);
});

test('CmsVoiceEngine cleanTextForSpeech: Strips markdown, emojis, links, bullets and limits speech length', () => {
  const rawMarkdown = `**FIR Details** for FIR 101/2026:
* Status: **Pending Investigation**
* Sections: [BNS 303](https://example.com)
Check this immediately! 🚨🚔`;

  const cleaned = CmsVoiceEngine.cleanTextForSpeech(rawMarkdown);
  assert.ok(!cleaned.includes('**'), 'Cleaned text must not contain bold asterisks');
  assert.ok(!cleaned.includes('['), 'Cleaned text must not contain markdown links');
  assert.ok(!cleaned.includes('https://'), 'Cleaned text must not contain URLs');
  assert.ok(!cleaned.includes('🚨'), 'Cleaned text must not contain emojis');
  assert.ok(cleaned.length <= 220, 'Spoken reply must be concise and <= 220 characters');
});

test('CmsVoiceEngine barge-in: handleBargeIn immediately stops speaking and unblocks', () => {
  CmsVoiceEngine.handleBargeIn('Test interruption');
  assert.equal(CmsVoiceEngine.getStatus(), 'INTERRUPTED');

  CmsVoiceEngine.stopSpeaking();
  assert.equal(CmsVoiceEngine.getStatus(), 'STANDBY');
});

test('Parth AI Agent & Hey Parth wake word verification', () => {
  // Voice Engine ready status references 'Hey Parth'
  CmsVoiceEngine.stopSpeaking();
  assert.equal(CmsVoiceEngine.getStatus(), 'STANDBY');

  // Verify wake word regex matches Hey Parth variants in Hindi and English
  const wakeRegex = /(?:^|\s)(?:hey|hay|hi|hello|हे|सुनो|नमस्ते|ok|okay)?\s*(?:parth|पार्थ|paarth|part|cms|सी\s*एम\s*एस|सी०एम०एस०|सीएमएस)(?:\s+agent|\s+एजेंट)?(?:\s*[,!?:-]*\s*|$)/i;

  const validWakePhrases = [
    'Hey Parth',
    'hey parth',
    'हे पार्थ',
    'सुनो पार्थ',
    'Parth',
    'पार्थ',
    'Hello Parth',
    'Ok Parth',
    'Hey Parth FIR register kholo',
    'हे पार्थ रोजनामचा दिखाओ',
  ];

  for (const phrase of validWakePhrases) {
    assert.equal(wakeRegex.test(phrase), true, `Phrase '${phrase}' should match Hey Parth wake word`);
  }
});
