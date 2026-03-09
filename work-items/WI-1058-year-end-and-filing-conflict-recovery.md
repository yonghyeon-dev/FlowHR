# WI-1058: Year-end and filing conflict recovery

## Background

Production verification found repeated `409` conflict responses in year-end settlement, filing, and withholding-related journeys. Even if some conflicts are domain-valid, the current product behavior does not feel recoverable or operator-friendly.

## Goal

Make year-end and filing flows recoverable and production-credible when conflict conditions occur.

## In Scope

- Admin payroll year-end settlement conflict behavior
- Admin payroll year-end filing conflict behavior
- Employee withholding/finalized settlement conflict behavior
- Product messaging and recovery guidance for valid conflict cases
- Verification of whether current conflict guards are correctly triggered or masking product defects

## Out Of Scope

- Replacing domain integrity guards that must remain as conflicts
- Tax engine redesign

## Acceptance Criteria

1. Each conflict-producing year-end flow is classified as either valid guard behavior or product defect.
2. Valid conflict cases surface clear recovery guidance to the operator or employee.
3. Product defects in year-end and filing conflict handling are fixed and re-verified in production.

## Progress

- Added a shared request-failure guidance helper for year-end settlement, filing, and withholding flows:
  - `src/components/payroll-year-end/request-failure-guidance.ts`
- Replaced raw conflict/error output with recovery-oriented guidance in:
  - `src/components/payroll-year-end/PayrollYearEndConsole.tsx`
  - `src/components/payroll-year-end/PayrollYearEndPreflightConsole.tsx`
  - `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx`
  - `src/components/withholding-receipt/useWithholdingReceiptRequests.ts`
  - `src/components/payroll-year-end-filing/request-feedback-helpers.ts`
  - `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
- Extended the same runtime normalization to nearby payroll close and insurance consoles so session and catch-path errors reuse the same product-safe guidance.
- Covered known production conflict cases:
  - feature flag disabled
  - missing finalized settlement / issued receipt
  - year-end settlement hash mismatch / already finalized
  - blocking year-end finalization and withholding guards
  - filing submit/resubmit/reopen/ack/cancel state conflicts
- Local verification:
  - `npm run typecheck`
