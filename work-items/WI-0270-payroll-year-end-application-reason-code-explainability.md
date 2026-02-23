# WI-0270: Payroll Year-End Application Reason Code Explainability

## Background

Year-end responses already returned cap-applied breakdown for deduction and tax
credit items, but operators still lacked explicit per-item reason codes that
explain why each amount was applied, capped, or effectively excluded.

## Scope

### In Scope

- year-end response explainability model
  - add per-item fields on deduction/tax-credit cap breakdown:
    - `applicationReasonCode` (`NO_INPUT` | `CAPPED_BY_RULE` | `APPLIED_AS_ENTERED`)
    - `applicationReason` (human-readable explanation)
  - apply to:
    - `POST /payroll/year-end/preview-settlement`
    - `POST /payroll/year-end/recalculate-settlement`
    - `POST /payroll/year-end/finalize-settlement`
    - `POST /payroll/year-end/export-filing-data`
- admin year-end console update
  - show reason-code summaries for tax-credit and deduction items
- spec/contract/test-cases update and contract version bump (`1.50.0`)
- WI-0270 regression e2e
  - `scripts/tests/e2e-wi0270-payroll-year-end-application-reason-code-explainability.test.ts`

### Out of Scope

- tax formula/cap threshold policy changes
- filing workflow transition logic changes
- scheduler/ops automation expansion

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0270-payroll-year-end-application-reason-code-explainability.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0260-payroll-year-end-deduction-cap-accuracy.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0261-payroll-year-end-tax-credit-cap-accuracy-v1.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
