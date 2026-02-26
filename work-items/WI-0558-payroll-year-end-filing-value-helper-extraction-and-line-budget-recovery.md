# WI-0558: Payroll Year-End Filing Value Helper Extraction and Line-Budget Recovery

## Summary
- Goal: reduce parsing/format helper duplication in filing console and keep orchestration-focused page flow.
- Scope:
  - `src/components/payroll-year-end-filing/value-helpers.ts`
  - `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
  - `scripts/tests/e2e-wi0558-payroll-year-end-filing-value-helper-extraction-and-line-budget-recovery.test.ts`
  - `ROADMAP.md`

## Delivery
- Extracted `parseRequiredInt`, `parseRate`, and `formatTimelineEntry` to `value-helpers.ts`.
- Rewired filing console to import helper functions and removed duplicated local implementations.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0558-payroll-year-end-filing-value-helper-extraction-and-line-budget-recovery.test.ts`
