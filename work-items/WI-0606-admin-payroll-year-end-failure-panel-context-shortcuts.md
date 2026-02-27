# WI-0606: Admin Payroll Year-End Failure Panel Context Shortcuts

## Summary
- Goal: shorten failure recovery by exposing context-aware shortcuts in the failure action panel.
- Scope:
  - `src/components/payroll-year-end-filing/FilingFailureActionPanel.tsx`
  - `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
  - `scripts/tests/e2e-wi0606-admin-payroll-year-end-failure-panel-context-shortcuts.test.ts`
  - `work-items/WI-0606-admin-payroll-year-end-failure-panel-context-shortcuts.md`
  - `ROADMAP.md`

## Delivery
- Added locale-aware failure panel quick-action copy (`ko`, `en`) as panel-local constants.
- Added context-aware shortcut actions:
  - when last failure action is `preflight_checklist`, panel exposes direct `Load Preflight` action.
  - when last failure action belongs to submission/reconciliation path (`submissions_refresh`, `submission_ack`, `submission_resubmit`, `submission_cancel`, `submission_reopen`), panel exposes direct `Open Rejected Queue` action.
- Wired new callbacks from filing console into failure panel.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0606-admin-payroll-year-end-failure-panel-context-shortcuts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0605-admin-payroll-year-end-preflight-rejected-submission-warning-action.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
