# WI-0603: Admin Payroll Year-End Preflight Direct Shortcut Actions

## Summary
- Goal: shorten blocker resolution path by adding check-specific direct shortcuts from the preflight blocker panel.
- Scope:
  - `src/components/payroll-year-end-filing/FilingPreflightBlockerPanel.tsx`
  - `scripts/tests/e2e-wi0603-admin-payroll-year-end-preflight-direct-shortcut-actions.test.ts`
  - `work-items/WI-0603-admin-payroll-year-end-preflight-direct-shortcut-actions.md`
  - `ROADMAP.md`

## Delivery
- Added check-specific direct shortcut actions in `FilingPreflightBlockerPanel`:
  - `confirmed_runs_present`, `no_previewed_runs` -> `/admin/payroll-close`
  - `no_undistributed_runs`, `no_pending_receipts` -> `/admin/payroll-payslip-delivery`
- Added localized shortcut labels (`ko`, `en`) for both routes.
- Kept existing dedicated actions intact:
  - pending filing submissions -> refresh submissions
  - non-taxable guard -> preview finalization rerun
  - fallback -> preflight detail page.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0603-admin-payroll-year-end-preflight-direct-shortcut-actions.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0602-admin-payroll-year-end-filing-preflight-settlement-hash-copy-action.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
