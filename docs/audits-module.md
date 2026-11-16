# Audits & Inspection

Entry points: Modules portal, sidebar and top-bar module switcher → `/audits`.

## Sources and permissions

- Complaints: `readComplaints`, filtered with `canViewComplaint`.
- FIRs: `readFirRecords`, filtered with `isFirVisibleToUser` (including custody transfers).
- Reports: embedded reports of authorized parent cases, not an independent permission grant.
- GD: Prisma `GDRecord`, existing jurisdiction scope; non-supervisory/non-intake officers additionally restricted to their author identity.
- Court replies: saved court-affidavit files. Supervisory auditors can aggregate across creators only when the parent case is currently accessible. Other officers retain the existing creator restriction.
- Scrutiny: saved scrutiny records; same parent-case and creator/supervisor restriction.

All operational sources are read-only through this module. No AI request is made to count or group records. No operational store or Prisma schema is migrated by this change.

## Counting semantics

Combined results count source records, not unique cases. A case and its report are two different source rows. Select a single source for case counts. All counts, groups and exports use the same server-side filter function. Only a page of result rows is sent to the browser; export has a 20,000-record cap.

Court saved replies, recorded requirements, prepared requirements and not-prepared requirements are distinct. A saved draft is not proof of court filing. To record a requirement, open a complaint/FIR audit row and enter the verified application/order reference and reply type. Select a saved reply if already prepared. Otherwise later use **Link prepared reply** on the requirement row. Links must refer to the same currently authorized case. Duplicate reference/type requirements are rejected under a filesystem lock.

Dates are normalized to IST calendar dates. Missing dates do not match bounded date filters. New court replies record server creation/update timestamps. Older court documents lacking reliable creation timestamps are excluded from creation-date ranges; their user-entered document/submission date is not substituted for creation time. Age is registration/creation age, not a statutory deadline. Unknown pending status is counted separately.

## Audit metadata

`prisma/audits/` is ignored by Git. It contains atomic, append-only JSON events for definitions, requirements, reply links, reviews, exports and inspection sessions. No API overwrites/deletes finalized snapshots. Back up this directory with the deployment's existing private runtime stores.

Inspection sessions capture filtered counts, record IDs/statuses and findings at creation. Progression: Draft → Running → Review Pending → Finalized → Closed. Later transitions preserve the captured snapshot, use an expected event ID, and take a per-session lock. Create another inspection to capture newer operational data. Finalization records the logged-in reviewer; it is not a cryptographic signature.

Definitions and history are owner-scoped. History snapshots become unavailable if any referenced source record is no longer in the viewer's current scope. This favors confidentiality over retaining visibility after transfers. Findings are potential data discrepancies; review events do not modify or accuse the source case/officer.

## Supported interface

- Overview, complaint/FIR/court/GD/report audits, pendency, officer grouping, discrepancies, custom filters, saved audits and history.
- Date presets including financial/calendar year; date dimension, source, search, station, district, officer, category, status, age and pending filters.
- AND/OR exact-value rules, primary/secondary sort, column selection/reordering, server pagination.
- Fifteen reusable starter filter templates; saved definitions preserve filters, columns and grouping.
- Count/percentage bars, pending average/median/oldest age, administrator-configurable ageing bands and previous equal-length period comparison when both date bounds are selected.
- CSV, XLSX and print/PDF exports with filter/scope/author/time/coverage metadata. CSV formula prefixes are escaped. Print content uses text nodes rather than interpolated HTML.

## Explicit data and implementation limits

- Browser-only miscellaneous court applications cannot be included in a central server audit yet.
- No complete registry of required replies/reports existed. Requirements recorded through Audits are explicit, not inferred from absence of documents.
- Court acceptance/cognizance, reliable stage-entry times, statutory deadline rules and normalized complexity scores are not synthesized.
- GD follow-up requirements and mandatory-document rules need verified source metadata before missing/follow-up counts can be certified.
- Current operational JSON repositories require server-side scans. This is not an indexed warehouse implementation; large-scale performance and database migration remain separate work.
- The rule builder supports one AND/OR group combined with the main filters, rather than nested groups. Full Hindi translation of audit labels is not implemented in this version.
- Browser appearance/interaction requires live verification; automated coverage checks calculations, API authorization, linking, pagination and filters.
