# WI-0264: Payroll Year-End Withholding Delta Breakdown UX

## Background

Year-end settlement payloads exposed only `withholdingDeltaKrw`. Operators still
had to mentally convert sign and magnitude to decide whether additional
withholding is due or refund should be returned.

## Scope

### In Scope

- settlement breakdown model hardening
  - add deterministic fields on year-end settlement payloads:
    - `additionalWithholdingDueKrw`
    - `withholdingRefundKrw`
  - enforce relation: `withholdingDeltaKrw = additionalWithholdingDueKrw - withholdingRefundKrw`
- output surface alignment
  - include breakdown fields in:
    - preview settlement
    - recalculation baseline/recalculated settlement
    - finalization settlement
    - filing export settlement payload
- admin year-end console update
  - show additional due/refund summary in settlement and recalculation panels
- spec/contract/test-cases update and contract version bump (`1.44.0`)
- WI-0264 regression e2e
  - `scripts/tests/e2e-wi0264-payroll-year-end-withholding-delta-breakdown-ux.test.ts`

### Out of Scope

- deduction-item cap rule changes (covered by WI-0260)
- tax-credit cap rule changes (covered by WI-0261)
- non-taxable upper-bound guard changes (covered by WI-0263)
- filing submission state-machine changes

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0264-payroll-year-end-withholding-delta-breakdown-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0188-payroll-year-end-deduction-input-and-recalculation-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0189-payroll-year-end-finalization-and-filing-export-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0263-payroll-year-end-non-taxable-income-upper-bound-guard.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
