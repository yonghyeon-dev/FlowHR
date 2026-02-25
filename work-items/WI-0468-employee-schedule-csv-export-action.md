# WI-0468: Employee Schedule CSV Export Action

## Summary
- Goal: Add a practical self-service export path so employees can download filtered schedule rows directly.
- Scope:
  - Add CSV export action to `/employee/schedule`.
  - Reuse current filter/search result (`rows`) for export target.
  - Add locale copy/status feedback for export result.

## Delivery
- Updated `src/components/scheduling/helpers.ts`
  - Added `exportScheduleRowsCsv(...)` with:
    - locale-aware header set (`ko`/`en`)
    - CSV escaping and browser download
    - boolean return (`false` when there is nothing to export)
- Updated `src/components/scheduling/EmployeeScheduleBoard.tsx`
  - Added `exportCsv()` handler.
  - Added status feedback:
    - success -> `copy.statusExported`
    - empty -> `copy.statusNoSchedulesToExport`
- Updated `src/components/scheduling/EmployeeScheduleBoardView.tsx`
  - Added export button wiring (`onExportCsv`, `copy.exportCsvAction`).
- Updated `src/components/scheduling/copy.ts`
  - Added locale keys:
    - `exportCsvAction`
    - `statusExported`
    - `statusNoSchedulesToExport`
- Added `scripts/tests/e2e-wi0468-employee-schedule-csv-export-action.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0468-employee-schedule-csv-export-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0467-employee-schedule-average-shift-hours-summary.test.ts`
