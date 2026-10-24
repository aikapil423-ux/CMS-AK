# CMS live website operator

The agent re-reads rendered controls on every command and before each action. Routes refresh from app source, the production app-paths manifest and visible internal links. New native inputs, selects, links and buttons therefore do not need a new command dictionary. Dynamic record URLs are discovered from visible links; the agent never guesses record identifiers.

Use native labels/aria-label (or data-agent-label) on controls, required/aria-required for mandatory fields, and role=tab for tabs. Unlabelled, canvas and custom widget controls need an accessible adapter. Hidden, disabled and password controls are excluded. Agent UI is excluded using data-cms-agent-ui.

For flexible natural-language planning configure GEMINI_API_KEY and CMS_AGENT_MODEL in server environment, then restart. Without both, local page, explicit field/value, search and button commands work. Configured planning sends the visible page fields and recent conversation to the configured Gemini model; do not enable it for real case data without your organization's authorization. No key is exposed to the browser.

Examples: `FIR register kholo`, `name = Ramesh, mobile = 9812345678`, `क्या जानकारी चाहिए`, `Save`, then `हाँ` or `cancel`. Buttons require confirmation; fields may trigger the website's existing draft autosave. Save completion must be confirmed by the website receipt/record. Navigation and subsequent form instructions currently run in separate turns. Attachment analysis is not implemented; the assistant explicitly reports this.

This feature discovers the current UI; it does not rewrite its own source, bypass access controls or guarantee support for every future widget. Existing demo authentication and legacy agent API are not production authorization. Do not expose the model planning endpoint publicly without adding your deployment's authenticated session/rate limiting.

Validation: `node --test tests/website-operator.test.cjs`; `npx tsc --noEmit --incremental false`.
