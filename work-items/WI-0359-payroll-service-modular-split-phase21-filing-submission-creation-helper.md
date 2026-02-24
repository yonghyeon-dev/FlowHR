# WI-0359: Payroll service modular split phase21 (filing submission creation helper)

## Summary
- Extracted year-end filing submission creation flow into `service-year-end-filing-submission-helpers.ts`.
- Removed the local `createYearEndFilingSubmission` implementation from `service.ts`.
- Rewired submit/resubmit endpoints to delegate through helper with `exportPayrollYearEndFilingData` callback.

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-year-end-filing-submission-helpers.ts`
- `scripts/tests/e2e-wi0359-payroll-service-modular-split-phase21-filing-submission-creation-helper.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0359-payroll-service-modular-split-phase21-filing-submission-creation-helper.test.ts`
