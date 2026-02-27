# WI-0607: Admin Payroll Preflight Shortcut Filter Normalization

## Summary
- Goal: prevent stale submission filters from hiding results when preflight shortcuts open pending/rejected queues.
- Scope:
  - `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
  - `scripts/tests/e2e-wi0607-admin-payroll-preflight-shortcut-filter-normalization.test.ts`
  - `work-items/WI-0607-admin-payroll-preflight-shortcut-filter-normalization.md`
  - `ROADMAP.md`

## Delivery
- Normalized shortcut filter presets in filing console:
  - `runOpenPendingSubmissionsFromPreflight`
  - `runOpenRejectedSubmissionsFromPreflight`
- Both shortcuts now clear stale settlement hash filter and reset sorting to `submittedAt/desc` before refresh.
- This avoids empty-state false negatives caused by previously applied hash/sort constraints.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0607-admin-payroll-preflight-shortcut-filter-normalization.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0606-admin-payroll-year-end-failure-panel-context-shortcuts.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
