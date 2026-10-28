# Website logic corrections

The audit corrections include SITREP point 8. Two requested exceptions remain: locked GD entries retain their numbering/attachment behavior (point 3), and FIR Legal Assistant analysis is unchanged (point 16).

## Corrected behavior

- SITREP uses recorded arrest, recovery, court-submission and completion dates, including events in older FIRs. Undated or unverified events are excluded and missing-data warnings are shown. Reporting years and pendency bands derive from actual dates.
- TA preparation uses matching recorded GD movements and officer ownership. Missing journeys, rates, approvals and amounts are not invented. Zero values remain zero when printed.
- Missing-person, lost-property, arrest and seizure forms begin without example identities or incident facts. Generated documents escape supplied text. Missing legal-source processing returns an error instead of invented statutory content.
- Registration numbering uses existing maxima. Equal numbers in different register types/stations coexist; duplicate identities within one register are rejected. Save failures preserve existing records and photographs.
- FIRs have a versioned server store, conflict detection, scoped reads/writes and explicit persistence errors. Legacy browser records are backed up before eligible migration; built-in demonstration FIRs are excluded. Number conflicts stop migration for review rather than silently renumbering legacy records.
- Complaint-to-FIR synchronization can be retried without creating another FIR. Final reports use the persisted report workflow, with SHO review before CHI. Report transitions also update the main FIR and retain historical completion events after reopening.
- API operations verify the session, request origin, jurisdiction and relevant ownership. Builder drafts, evidence and staff/settings operations enforce appropriate ownership or role checks.
- Evidence storage preserves original data, rejects ambiguous aliases and reports failed writes/downloads. Missing compressed files are not returned under an incorrect image format.
- Navigation warns about unsaved document changes, including browser history navigation.

## Operational limits

FIR persistence currently uses `prisma/firs-store.json` with atomic replacement, a write lock and record versions. Back up this file with the SQLite database and uploaded evidence. Hosting must provide persistent storage; independent server instances need shared storage or a transactional database implementation.

Several auxiliary registers remain browser-local. Their save failures are surfaced, but they do not become a shared multi-device database through these corrections. Historical records with missing event dates require manual verification; the application does not infer those dates from FIR registration.

Production authentication requires configured credentials/session settings; development demonstration credentials are not accepted in production. No deployment or live case-data migration was performed during verification.

## Verification

Run `node --test tests/*.test.cjs`, `npx tsc --noEmit` and `npm run build`. Regression tests use memory or isolated temporary stores and do not write to live case records.
