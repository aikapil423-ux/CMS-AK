# FIR case analysis

FIR Profile has Knowledge Graph and Case contradictions tabs. They use saved FIR facts, case diary text and completed evidence linked by the exact FIR ID or its source complaint ID. Evidence access follows the existing officer ownership rules; FIR access follows assignment/jurisdiction rules. FIR documents without a corresponding processed record are counted as incomplete.

## AI setup

Set `GEMINI_API_KEY` in the server environment and restart the Next.js server. Never put the key in a `NEXT_PUBLIC_` variable. The user-provided key is kept in the ignored server `.env`, not in prompts or frontend assets. `CMS_EVIDENCE_MODEL` selects extraction and `CMS_CASE_ANALYSIS_MODEL` selects comparison. This workspace uses the live-tested `gemini-3.5-flash-lite`; the earlier `gemini-3.5-flash` extraction requests returned HTTP 503.

Without a key, saved structured field differences and the graph remain available. The panel explicitly reports that AI comparison is unavailable. Failed or pending evidence is excluded and counted as incomplete. A file without extracted text is not reported as successfully processed for FIR use when AI extraction is unavailable.

## Comparison and persistence

- FIR saves, evidence processing and evidence corrections schedule a backend comparison after saving the record.
- Reopening either panel loads/reuses analysis when input is unchanged. Analyze / Refresh restarts comparison. New uploads use a server content checksum, never just a filename, to decide whether processing can be reused.
- Source snapshots and old revisions, graph nodes/links, field differences and validated AI flags are saved atomically to `prisma/case-analysis/`. Back up this directory alongside the evidence and FIR stores. It is excluded from Git because it contains case data.
- Historical tracking starts when this feature first observes a source; it cannot recover overwritten values from before then. Removed or no-longer-accessible evidence is removed from the next comparison.
- Large cases are compared in overlapping text batches covering every source-group pair. Progress is saved between requests. An open panel continues unfinished batches; AI failures remain visible and can be retried. Incomplete analysis never displays a clean all-clear.
- Each AI flag must cite two supplied sources with exact quotations. Potential contradictions require officer review; source validation is not proof that the model's interpretation is correct. Structured value differences are separately labeled and may reflect corrections or differing context.

No database migration or new dependency is required. Storage remains the app's existing file-backed backend pattern, with a separate analysis file per FIR/officer.

## Live reference renderer and extraction

The reference was cloned to `D:\ai INVESTIGATER`; assets and extraction prompt come from live commit `2972df8`. The 2D layout, role palette, Network renderer, legend filters, path finder and SVG export are reused in a sandboxed workspace. An additional 3D perspective view uses the same entities, relationships and source citations, with orbit/pan/zoom, node dragging and PNG export.

`prompts/investigation/extraction.txt` contains the original repository extraction prompt. `resolution.txt` contains the CMS resolution contract and the user's temporal/provenance requirements. The reference has no separate Gemini resolution prompt: its actual `js/identity.js` implementation is retained as `src/lib/investigation/identity.cjs`. CMS uses its identity matching/merge helpers conservatively, preserves all source citations and does not automatically merge people just because they share a phone.

The evidence processor and FIR/complaint autofill send the saved prompt and resolution contract to Gemini. CMS fields retain their existing JSON shape; the original repository entities, events, relationships, statements and evidence are returned under `investigation`. That output and prompt hashes/commit are saved in processed evidence. Changing a prompt invalidates the extraction cache.

Opening either case panel checks for old/missing extraction output and processes eligible stored originals one file at a time before comparing the case. Progress and file-specific failures are visible. Evidence without an accessible original requires re-upload; another officer's evidence is not rewritten. Unsupported or failed extraction never discards the original file.

Every graph entity retains its original document link, exact quote/page when available, and all source references after resolution. Date/time are never independent nodes; they remain event/relationship attributes or labeled source context. Residential addresses stay person attributes. Contradiction cards follow the reference summary/severity/A-vs-B/source-document layout with additional old/new highlighting.

Browser visual QA was not completed because local-browser origin access was declined. The offline DOM harness tests the actual D3 renderer and 2D/3D interactions without browser/network access; it does not replace pixel-level visual review.

## Checks

`node --test tests/case-analysis.test.cjs tests/case-analysis-persistence.test.cjs tests/case-analysis-panel.test.cjs`

Graph/extraction checks: `node --test tests/knowledge-graph.test.cjs tests/investigation-extraction.test.cjs`

Optional offline DOM QA: install jsdom in a temporary directory, set `CMS_GRAPH_QA_MODULE` to its `node_modules/jsdom` path, and run `node scripts/qa-graph-dom.cjs`. No workspace dependency is added.

Explicit live synthetic-only Gemini check: `node scripts/qa-investigation-gemini.cjs`. It prints counts/status, never the API key or real case data.

Tests cover chronological differences, missing data, shared phones, source quotations, graph provenance, full batching coverage, saved revisions, scope isolation, removed evidence and visible AI failures. AI responses are mocked; live AI requires the server key.
