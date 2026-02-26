# WI-0552: Payroll Year-End Filing Filtered-Empty Guidance and Transport Summary Localization

## Summary
- Goal: improve filing submission panel clarity when filters return zero rows and remove transport summary hardcoded token.
- Scope:
  - `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
  - `src/components/payroll-year-end-filing/copy.ts`
  - `scripts/tests/e2e-wi0552-payroll-year-end-filing-filtered-empty-guidance-and-transport-summary-localization.test.ts`
  - `ROADMAP.md`

## Delivery
- Added filtered-empty state detection using submission summary (`totalCount > 0 && filteredCount === 0`).
- Switched empty message to `noSubmissionMatchesFilters` when filter result is empty.
- Replaced `nts_api_mock` hardcoded summary token with locale copy key `transportShortNtsApiMockLabel`.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0552-payroll-year-end-filing-filtered-empty-guidance-and-transport-summary-localization.test.ts`
