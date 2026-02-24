# WI-0384: Employee derived helper phase3 extraction

## Summary
- Expanded `page-derived-helpers.ts` with employee dashboard derived builders for leave calendar cells/rows, status summaries, resubmit candidates, and integrated summary cards.
- Rewired `src/app/employee/page.tsx` to delegate those derived `useMemo` blocks to helper functions.
- Preserved existing employee dashboard behavior while reducing `employee/page.tsx` size.

## Scope
- `src/app/employee/page.tsx`
- `src/app/employee/page-derived-helpers.ts`
- `scripts/tests/e2e-wi0384-employee-derived-helper-phase3-extraction.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0384-employee-derived-helper-phase3-extraction.test.ts`
- `npm.cmd run -s typecheck`
