# WI-0106: Payroll KR Baseline Tax Credit and Monthly Boundary Guard

## Background and Problem

`statutory_kr_baseline` currently supports flat/progressive tax and insurance caps, but it does not support additive tax credits and does not enforce monthly payroll boundary consistency.

## Scope

### In Scope

- Extend statutory input with:
  - `additionalTaxCreditKrw`
  - `dependentCount`
  - `dependentTaxCreditPerPersonKrw`
  - `requireMonthlyBoundary`
- Apply tax credits to income tax before local income tax calculation.
- Add optional monthly boundary validation in `Asia/Seoul`:
  - start must be first day `00:00:00`
  - end must be last day `23:59:*`
  - start/end must be within the same month
- Add admin payroll preview UI fields for tax credits and monthly boundary toggle.
- Add e2e regression coverage for:
  - tax-credit arithmetic
  - monthly boundary rejection (`400`) when invalid

### Out of Scope

- Full legal-grade KR tax engine
- Year-end tax settlement
- External filing/remittance integration

## User Scenarios

1. Payroll operator enters dependent tax credits and gets deterministic net-pay preview.
2. Payroll operator enables monthly boundary guard and receives immediate rejection for non-monthly period.
3. Admin compares gross-only preview and statutory preview with tax credits in the same UI.

## Payroll Accuracy and Calculation Rules

- `taxableBaseKrw = max(grossPayKrw - nonTaxableIncomeKrw, 0)`
- `preCreditIncomeTaxKrw`:
  - progressive brackets when `incomeTaxBrackets` exists
  - otherwise flat-rate baseline
- `dependentTaxCreditKrw = dependentCount * dependentTaxCreditPerPersonKrw`
- `totalTaxCreditKrw = additionalTaxCreditKrw + dependentTaxCreditKrw`
- `incomeTaxKrw = max(preCreditIncomeTaxKrw - totalTaxCreditKrw, 0)`
- `localIncomeTaxKrw = round(incomeTaxKrw * localIncomeTaxRate)`
- `withholdingTaxKrw = incomeTaxKrw + localIncomeTaxKrw`
- Monthly boundary guard (`requireMonthlyBoundary=true`) validates period in `Asia/Seoul`.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator | System |
| --- | --- | --- | --- | --- | --- |
| Statutory preview with tax credits | Allow | Deny | Deny | Allow | N/A |
| Confirm payroll run | Allow | Deny | Deny | Allow | N/A |
| Read own confirmed payslip | Deny | Deny | Allow | Deny | N/A |

## Data Changes

- No Prisma schema changes
- No migration changes
- PayrollRun deductionBreakdown additive fields only

## API and Event Changes

- Endpoint:
  - `POST /payroll/runs/preview-with-deductions`
- Additive statutory payload fields:
  - `additionalTaxCreditKrw`
  - `dependentCount`
  - `dependentTaxCreditPerPersonKrw`
  - `requireMonthlyBoundary`
- Existing event payload additive extension:
  - `payroll.deductions.calculated.v1`

## Test Plan

- Unit:
  - tax-credit arithmetic (pre-credit tax -> post-credit tax -> local tax)
  - monthly boundary validator (`Asia/Seoul`)
- Integration:
  - statutory payload validation for new fields
  - boundary rejection when monthly guard is enabled
- Regression:
  - preserve WI-0101 and WI-0105 deterministic outputs
  - add WI-0106 e2e deterministic replay
- Authorization:
  - payroll_operator/admin only for preview-with-deductions path

## Observability and Audit Logging

- Audit:
  - `payroll.deductions_calculated` includes tax-credit and monthly-boundary trace
- Metrics:
  - `payroll_deductions_preview_latency_ms`
  - `payroll_monthly_boundary_reject_count`

## Rollback Plan

- Disable `FLOWHR_PAYROLL_KR_BASELINE_V1` if statutory path issues occur.
- Keep gross-only preview endpoint available as fallback.
- No DB rollback required.

## Definition of Ready (DoR)

- [x] Tax-credit and boundary requirements are documented and deterministic.
- [x] Contract/API/test-case update scope is defined.
- [x] Rollback and feature-flag fallback are identified.

## Definition of Done (DoD)

- [x] Schema/service/UI changes implemented.
- [x] WI-0106 e2e test added and passing.
- [x] Payroll contract/API/test-cases/RFC updated to `1.8.0`.
- [x] QA Spec Gate and Code Gate evidence captured via CI checks.
