# WI-0605: Admin Payroll Year-End Preflight Rejected-Submission Warning Action

## Summary
- Goal: surface rejected filing submissions in preflight and provide direct follow-up action.
- Scope:
  - `src/features/payroll/service-output-types.ts`
  - `src/features/payroll/service-year-end-reporting-helpers.ts`
  - `src/components/payroll-year-end-filing/FilingPreflightBlockerPanel.tsx`
  - `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
  - `scripts/tests/e2e-wi0605-admin-payroll-year-end-preflight-rejected-submission-warning-action.test.ts`
  - `work-items/WI-0605-admin-payroll-year-end-preflight-rejected-submission-warning-action.md`
  - `ROADMAP.md`

## Delivery
- Added preflight checklist key `no_rejected_filing_submissions`:
  - `pass` when rejected submissions are 0.
  - `warn` when rejected submissions exist.
- Extended preflight checklist output key union in payroll service output types.
- Added warning follow-up action in preflight blocker panel for rejected submissions.
- Added console action `runOpenRejectedSubmissionsFromPreflight`:
  - preconfigures submission filters to `status=acknowledged`, `ackStatus=rejected`.
  - triggers submission refresh immediately.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0605-admin-payroll-year-end-preflight-rejected-submission-warning-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0604-admin-payroll-year-end-preflight-settlement-hash-warning-action.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
