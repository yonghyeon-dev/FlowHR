# WI-0602: Admin Payroll Year-End Filing Preflight Settlement-Hash Copy Action

## Summary
- Goal: reduce operator friction by adding one-click settlement-hash copy in preflight blocker panel so expected-hash guard fields can be populated quickly.
- Scope:
  - `src/components/payroll-year-end-filing/FilingPreflightBlockerPanel.tsx`
  - `scripts/tests/e2e-wi0602-admin-payroll-year-end-filing-preflight-settlement-hash-copy-action.test.ts`
  - `work-items/WI-0602-admin-payroll-year-end-filing-preflight-settlement-hash-copy-action.md`
  - `ROADMAP.md`

## Delivery
- Upgraded `FilingPreflightBlockerPanel` to client-interactive mode (`"use client"`).
- Added settlement-hash quick action when hash exists:
  - `Copy hash` action button
  - Clipboard integration via `navigator.clipboard.writeText(...)`
  - localized success/failure status message
  - localized hint guiding operators to paste hash into `Expected Settlement Hash` guard fields.
- Kept existing blocker-action behavior intact (pending submissions refresh, preview rerun, preflight detail deep-link).

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0602-admin-payroll-year-end-filing-preflight-settlement-hash-copy-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0601-admin-payroll-year-end-filing-preflight-blocker-actions.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint` (known existing warnings only)
