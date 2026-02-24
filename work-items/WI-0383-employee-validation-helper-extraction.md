# WI-0383: Employee validation helper extraction

## Summary
- Extracted employee validation and submit-checklist builders into `page-validation-helpers.ts`.
- Rewired `src/app/employee/page.tsx` validation/checklist `useMemo` blocks to delegate to helper functions.
- Preserved existing correction/leave/resubmit validation behavior while reducing `employee/page.tsx` size.

## Scope
- `src/app/employee/page.tsx`
- `src/app/employee/page-validation-helpers.ts`
- `scripts/tests/e2e-wi0383-employee-validation-helper-extraction.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0383-employee-validation-helper-extraction.test.ts`
- `npm.cmd run -s typecheck`
