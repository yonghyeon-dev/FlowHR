# WI-0376: Employee request helper extraction and runtime datetime locale

## Summary
- Extracted employee request feedback/search/timeline/failure-cause derived logic into `src/app/employee/page-request-helpers.ts`.
- Rewired `src/app/employee/page.tsx` to delegate large `useMemo` blocks to helper functions.
- Updated employee datetime formatter to runtime locale (`formatDateTime(value, runtimeLocale)`) and wired `formatDateTimeByLocale` across page and dashboard panel props.

## Scope
- `src/app/employee/page.tsx`
- `src/app/employee/page-helpers.ts`
- `src/app/employee/page-request-helpers.ts`
- `scripts/tests/e2e-wi0376-employee-request-helper-extraction-and-runtime-datetime-locale.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0376-employee-request-helper-extraction-and-runtime-datetime-locale.test.ts`
- `npm.cmd run -s typecheck`
