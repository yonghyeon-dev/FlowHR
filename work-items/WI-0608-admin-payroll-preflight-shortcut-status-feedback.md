# WI-0608: Admin Payroll Preflight Shortcut Status Feedback

## Summary
- Goal: provide immediate status feedback when preflight shortcuts open submission queues.
- Scope:
  - `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
  - `scripts/tests/e2e-wi0608-admin-payroll-preflight-shortcut-status-feedback.test.ts`
  - `work-items/WI-0608-admin-payroll-preflight-shortcut-status-feedback.md`
  - `ROADMAP.md`

## Delivery
- Added locale-aware shortcut status copy (`ko`, `en`) in filing console.
- Added immediate status feedback in preflight shortcut handlers:
  - pending queue shortcut announces queue opening.
  - rejected queue shortcut announces queue opening.
- Kept existing refresh flow unchanged so queue load summary still replaces the short status message after API response.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0608-admin-payroll-preflight-shortcut-status-feedback.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0607-admin-payroll-preflight-shortcut-filter-normalization.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
