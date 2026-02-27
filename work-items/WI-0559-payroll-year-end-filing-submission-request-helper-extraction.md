# WI-0559: Payroll Year-End Filing Submission Request Helper Extraction

## Summary
- Goal: centralize filing submission request query/payload creation and reduce mutation-handler verbosity.
- Scope:
  - `src/components/payroll-year-end-filing/submission-request-helpers.ts`
  - `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
  - `scripts/tests/e2e-wi0559-payroll-year-end-filing-submission-request-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Extracted submission list query builder and submit/ack/resubmit payload builders into `submission-request-helpers.ts`.
- Replaced inline payload/query blocks in filing console actions with helper delegation.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0559-payroll-year-end-filing-submission-request-helper-extraction.test.ts`
