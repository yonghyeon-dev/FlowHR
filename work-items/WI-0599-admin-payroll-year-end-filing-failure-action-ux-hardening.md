# WI-0599: Admin Payroll Year-End Filing Failure-Action UX Hardening

## Summary
- Goal: harden `/admin/payroll-year-end-filing` failure feedback so operators can recover quickly after failed API actions.
- Scope:
  - `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
  - `src/components/payroll-year-end-filing/request-feedback-helpers.ts`
  - `src/components/payroll-year-end-filing/copy.ts`
  - `scripts/tests/e2e-wi0599-admin-payroll-year-end-filing-failure-action-ux-hardening.test.ts`
  - `work-items/WI-0599-admin-payroll-year-end-filing-failure-action-ux-hardening.md`
  - `ROADMAP.md`

## Delivery
- Added `request-feedback-helpers.ts` to centralize:
  - API log entry appending
  - API error message extraction
  - localized request-failure status message formatting
- Updated `PayrollYearEndFilingConsole.tsx`:
  - tracks last failed action (`action/status/message/time/submissionId`)
  - normalizes error feedback via `recordFailure(...)`
  - adds `Retry Failed Action` follow-up entrypoint with action-specific retry routing
  - adds failure action panel with retry/refresh-submissions/load-ack-catalog/clear controls
- Extended locale copy (`copy.ts`) for failure action panel labels (ko/en).
- Kept line budget guard intact:
  - `PayrollYearEndFilingConsole.tsx` line count remains `<= 1300`.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0599-admin-payroll-year-end-filing-failure-action-ux-hardening.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0558-payroll-year-end-filing-value-helper-extraction-and-line-budget-recovery.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0560-payroll-year-end-filing-submission-state-helper-extraction.test.ts`
- [x] `npm.cmd run lint`
- [x] `npm.cmd run typecheck`
