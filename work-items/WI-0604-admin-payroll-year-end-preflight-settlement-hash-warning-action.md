# WI-0604: Admin Payroll Year-End Preflight Settlement-Hash Warning Action

## Summary
- Goal: make settlement-hash warning immediately actionable from the preflight blocker panel.
- Scope:
  - `src/components/payroll-year-end-filing/FilingPreflightBlockerPanel.tsx`
  - `scripts/tests/e2e-wi0604-admin-payroll-year-end-preflight-settlement-hash-warning-action.test.ts`
  - `work-items/WI-0604-admin-payroll-year-end-preflight-settlement-hash-warning-action.md`
  - `ROADMAP.md`

## Delivery
- Added localized `refreshSettlementHashAction` copy (`ko`, `en`) in preflight blocker panel.
- Added warning-level follow-up action for `settlement_hash_available`:
  - warning row now exposes a direct button that reruns preflight finalization preview via `onPreviewFinalization`.
- Kept existing fail-check follow-up actions and fallback detail route behavior unchanged.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0604-admin-payroll-year-end-preflight-settlement-hash-warning-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0603-admin-payroll-year-end-preflight-direct-shortcut-actions.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
