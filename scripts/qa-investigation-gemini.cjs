// Explicit live smoke test using synthetic text only; never reads or uploads case records.
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/investigationPromptService.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
}).outputText, { exports: exported, require, process, console });
const env = fs.readFileSync('.env', 'utf8');
const key = process.env.GEMINI_API_KEY || env.match(/^GEMINI_API_KEY\s*=\s*(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
const text = 'SYNTHETIC QA DOCUMENT, NOT A REAL CASE. Witness Raman stated: On 2026-11-02 at 20:00 I saw vehicle HR01AB1234 near Karnal bus stand. My phone number is 9000000001.';
const prompt = exported.withInvestigationPrompt('Return JSON with rawText (copy the supplied document exactly) and investigation (the reference output schema).', 'qa-source');
(async () => {
  if (!key) throw new Error('Server key is not configured.');
  const model = process.env.CMS_EVIDENCE_MODEL || env.match(/^CMS_EVIDENCE_MODEL\s*=\s*(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '') || 'gemini-3.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(90000),
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt.text + '\n\nDOCUMENT TEXT:\n' + text }] }], generationConfig: { temperature: .1, responseMimeType: 'application/json', maxOutputTokens: 10000 } })
  });
  if (!response.ok) { const error = await response.json().catch(() => ({})); console.log(JSON.stringify({ status: response.status, success: false, reason: String(error.error?.message || '').replaceAll(key, '[REDACTED]').slice(0, 400) })); process.exitCode = 1; return; }
  const body = await response.json();
  const reply = body.candidates?.[0]?.content?.parts?.filter(p => p.text && !p.thought).map(p => p.text).join('');
  const data = JSON.parse(reply);
  const result = exported.normalizeInvestigation(data.investigation, 'qa-source', data.rawText || text, prompt.audit);
  console.log(JSON.stringify({ status: response.status, promptCommit: result.promptAudit.sourceCommit, entities: result.entities.length,
    relationships: result.relationships.length, events: result.events.length, allCitationsUseActualDocument: result.entities.every(e => e.source.documentId === 'qa-source'),
    standaloneTemporalEntities: result.entities.filter(e => /^(DATE|TIME|DATETIME|TIMESTAMP)$/i.test(e.type)).length, validationWarnings: result.validationWarnings.length }));
  if (!result.entities.length) process.exitCode = 1;
})().catch(error => { console.log(JSON.stringify({ testFailed: true, errorType: error.name })); process.exitCode = 1; });
