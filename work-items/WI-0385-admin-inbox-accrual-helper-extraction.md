# WI-0385: Admin inbox accrual helper extraction

## Summary
- Extracted admin inbox fetch, payroll confirm response parsing, and leave accrual settlement parsing into `page-action-helpers.ts`.
- Rewired `src/app/admin/page.tsx` to delegate:
  - `refreshInbox`
  - `confirmPayroll`
  - `settleLeaveAccrual`
- Preserved dashboard behavior while reducing inline action logic in `admin/page.tsx`.

## Scope
- `src/app/admin/page.tsx`
- `src/app/admin/page-action-helpers.ts`
- `scripts/tests/e2e-wi0385-admin-inbox-accrual-helper-extraction.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0385-admin-inbox-accrual-helper-extraction.test.ts`
- `npm.cmd run -s typecheck`
