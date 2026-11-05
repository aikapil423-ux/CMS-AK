# Weekly Crime Diary workbook panels

The Weekly Crime Diary report now has all 22 sheets from the supplied workbook,
in their original order. `weeklyDiaryTemplate.json` contains headers, merged
cell spans, column widths, fonts, alignment and border metadata. It contains no
sample FIRs, names, phone numbers or the original filled counts. The source XLSX
is only read during template extraction and is never changed or imported as case
records.

Both dates start blank. Selecting an authorized station and valid inclusive
From–To range requests `/api/reports/weekly-diary`. Weekly event tables use their
actual event dates in the Indian calendar. Pendency tables use available status
as of To; saved history/dated challans are used where available. Undated events
and unprovable historical states remain unavailable rather than becoming NIL.
Registration, report preparation, dispatch, checking and court submission are
separate stages. Sorted sheets reuse the same case sets, not additional cases.

Only authenticated, scoped backend FIRs, complaints and completed processed
evidence are read. Extracted events require a matched verbatim source quote and
an event date. Missing roster, vehicle, Parcha-12 or specialist register facts
stay blank and editable. This feature does not manufacture those facts from demo
data or process/upload timestamps.

The source has zero embedded Excel formulas. Its textual calculation rules are
implemented in their original positions: Performa F20 = C20 + (E20 - D20), G21 =
E21 / F20, G22 = E22 / F20. The Parcha-12 total sums C:X when every required count
is available. Inputs can be edited; formula results are protected, recalculate
and have source labels. Missing inputs/zero denominators stay blank. Unspecified
spreadsheet calculations are not invented.

Auto-filled/calculated fields glow green and expose their source on focus.
Manual edits clear that field's automatic provenance. Case-linked manual notes
and sizes are rebased when rows move after refresh. An ambiguous/disappearing
case stops regeneration instead of silently attaching edits to another case.

Each table can grow beyond the reference file's filled row count. Rows can be
added/deleted, and additional fields or blank rows can be added to each sheet.
Column widths, row/field heights and field resize handles are editable. Textareas
grow to fit their content. Layout changes apply to the user's period-specific
copy, not the shared template. Reset Layout restores the template and explicitly
confirms removal of custom layout/added fields.

Generated snapshots and saved edits/layouts persist atomically in the ignored
`prisma/weekly-diary/` runtime directory, keyed by owner, station and exact period.
Back up/persist this directory with the other backend stores. Save All Sheets
uses revision checks; failed saves remain visible and do not silently fall back
to browser storage. No database migration or original case mutation is required.

Tests: `node --test tests/weekly-diary-workbook.test.cjs`. Coverage includes blank
templates, calendar boundaries, no duplicate stage counts, quoted evidence,
historical unknowns, calculation edits, owner/period isolation, stale writes,
row reordering and saved layout validation. Offline layout checks use synthetic
records only.

All 22 sheets share direct cell editing, double-click heading editing, bold/italic,
alignment/font size, keyboard navigation, Excel TSV paste and undo/redo. Detailed
controls live in Cell Format; sheet tabs wrap onto multiple lines without horizontal scrolling. Cursor resizing
redistributes width within the same row, bounded by the A4 printable width.
Labels and formatting are validated and persisted with the diary snapshot.
Formula outputs stay protected and recalculate from their editable inputs.

Dragging a table header redistributes column widths throughout that table,
including new data rows and age bands. Resizing a data cell remains row-local.
Header widths are saved separately per table and included in undo/redo and print.
