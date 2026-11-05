# Editable scrutiny packet

The Prosecution → New Scrutiny Performa button opens the native 12-page form.
It contains no embedded PDF, scanned image background or external PDF viewer.
The page sequence follows the supplied reference: forwarding letter; scrutiny
points 1–31; points 32–59; identity particulars (two pages); seizure (two pages);
complainant application; investigation/GD; accused/family/bank; property/prior
cases; principal witness.

`scrutinyPdfTemplate.ts` is the field catalogue. `ScrutinyNativePages.tsx` is the
shared editable/print layout. Print clones all twelve native pages, retains table
borders and blank answer space, and removes input borders, green glow and upload
controls. A4 is 210 × 297 mm. Long answers can continue to additional printed
pages rather than being cut off. No signatures or review ticks are autofilled.

Select a saved backend FIR, then use Autofill or Process FIR Documents & Autofill.
Document processing reuses the existing persisted evidence workflow and saved
extraction/resolution prompts. Upload & Process authorizes the FIR before sending
the original to that workflow. New evidence and originals remain in the existing
backend evidence store. Failures are visible and do not discard manual edits.

Autofilled facts retain origin, source ID/name and a quote. Their fields glow
green; a manual edit clears that provenance/glow. AI suggestions must quote the
selected case's authorized evidence, and the value must occur in that quote.
Unknown facts stay blank. Multiple accused are not merged; select the intended
accused before preparing each packet.

Drafts and saved packets are stored atomically in `prisma/scrutiny-records/`,
scoped to the authenticated owner and authorized FIR. This runtime directory is
ignored by Git and must be backed up/persisted alongside the other backend case
stores. Revision checks prevent stale tabs from overwriting newer changes.
Existing browser scrutiny records remain readable with their legacy preview;
new packets save, reopen and delete through the backend API. Workflow decision,
court, challan type, scrutiny officer and objections remain available separately
from the printable form, under Scrutiny decision & court details.

Validation: `node --test tests/scrutiny-packet.test.cjs` covers native page/field
coverage, no PDF background, scoped autofill, quoted AI values, persistence,
owner separation and stale revision rejection. Print QA uses synthetic data only.
