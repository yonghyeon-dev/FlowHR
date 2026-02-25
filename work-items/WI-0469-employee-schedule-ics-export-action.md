# WI-0469: Employee Schedule ICS Export Action

## Summary
- Goal: let employees export filtered schedule rows as iCalendar (`.ics`) so they can subscribe/import into personal calendar apps.
- Scope:
  - Add ICS export action to `/employee/schedule`.
  - Reuse current filter/search result (`rows`) for export target, same as CSV.
  - Add locale copy/status feedback for ICS export.
  - Keep schedule helper files within line-budget by extracting export logic to dedicated module.

## Delivery
- Added `src/components/scheduling/export-helpers.ts`
  - Added `exportScheduleRowsIcs(...)`:
    - generates RFC5545-friendly `VCALENDAR/VEVENT` payload
    - escapes ICS text and writes UTC datetime fields
    - browser download with `employee-schedule-{date}.ics`
    - returns `false` when no valid rows are exportable
  - Kept `exportScheduleRowsCsv(...)` in same export-focused module for cohesion.
- Updated `src/components/scheduling/helpers.ts`
  - Re-exported schedule export helpers from `export-helpers.ts`.
  - Preserved domain/date/runtime helper responsibilities only.
  - Normalized Korean runtime fallback message to UTF-8-safe text.
- Updated `src/components/scheduling/EmployeeScheduleBoard.tsx`
  - Added `exportIcs()` handler.
  - Added ICS status feedback:
    - success -> `copy.statusIcsExported`
    - empty -> `copy.statusNoSchedulesToExport`
- Updated `src/components/scheduling/EmployeeScheduleBoardView.tsx`
  - Added `onExportIcs` prop + button wiring (`copy.exportIcsAction`).
- Updated `src/components/scheduling/copy.ts`
  - Added locale keys:
    - `exportIcsAction`
    - `statusIcsExported`
  - Rewrote scheduling copy file in UTF-8 to remove corrupted Korean literals.
- Added regression tests:
  - `scripts/tests/e2e-wi0468-employee-schedule-csv-export-action.test.ts` (updated for helper split)
  - `scripts/tests/e2e-wi0469-employee-schedule-ics-export-action.test.ts`

## Validation
- [ ] `npm.cmd run -s typecheck`
- [ ] `npm.cmd exec tsx scripts/tests/e2e-wi0468-employee-schedule-csv-export-action.test.ts`
- [ ] `npm.cmd exec tsx scripts/tests/e2e-wi0469-employee-schedule-ics-export-action.test.ts`
- [ ] `npm.cmd exec tsx scripts/tests/e2e-wi0467-employee-schedule-average-shift-hours-summary.test.ts`
