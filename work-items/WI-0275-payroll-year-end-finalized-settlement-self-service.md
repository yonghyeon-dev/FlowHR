# WI-0275: Payroll Year-End Finalized Settlement Self-Service Read

## Background

Employees could preview withholding receipt readiness and download issued receipt artifacts,
but there was no self-service API to read the finalized year-end settlement snapshot itself
(finalization ID, settlement hash, liability/delta). This made it hard to verify finalization
results before/alongside receipt usage.

## Scope

### In Scope

- add finalized settlement read endpoint
  - add `GET /payroll/year-end/finalized-settlement`
  - query: `year`, `employeeId`
  - returns latest finalized year-end settlement snapshot:
    - `finalizationId`, `finalizedAt`, `settlementHash`
    - annual totals + settlement liability/delta breakdown
    - deduction eligibility/items and run-state guard snapshot
  - guard rules:
    - employee can read only own finalized settlement
    - payroll_operator/admin can read tenant-scoped employee settlement
    - return `404` when finalized snapshot does not exist
- employee withholding receipt console wiring
  - add finalized settlement load action + result panel
- update payroll specs/contract/test-cases and contract version bump (`1.55.0`)
- add WI-0275 regression e2e
  - `scripts/tests/e2e-wi0275-payroll-year-end-finalized-settlement-self-service.test.ts`

### Out of Scope

- settlement calculation/cap/rule changes
- new filing workflow stages
- scheduler/ops automation expansion

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0275-payroll-year-end-finalized-settlement-self-service.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0274-payroll-year-end-withholding-receipt-document-download.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run build`
