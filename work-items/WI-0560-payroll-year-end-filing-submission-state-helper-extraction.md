# WI-0560: Payroll Year-End Filing Submission State Helper Extraction

## Summary
- Goal: isolate submission list update/filter-summary logic from filing console UI orchestration.
- Scope:
  - `src/components/payroll-year-end-filing/submission-state-helpers.ts`
  - `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
  - `scripts/tests/e2e-wi0560-payroll-year-end-filing-submission-state-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Extracted `upsertSubmissionAtTop`, `replaceSubmissionById`, and `buildActiveSubmissionFiltersSummary`.
- Filing console now computes active-filter summary through helper and delegates submission list state updates.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0560-payroll-year-end-filing-submission-state-helper-extraction.test.ts`
