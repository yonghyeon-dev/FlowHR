# WI-0259: Payroll Insurance Settlement Rounding Accuracy

## Background

`POST /payroll/runs/preview-insurance-settlement` supported caps and deltas, but
its contribution rounding was fixed to `Math.round` and did not provide a
component-level rounding trace. This made reconciliation less predictable when
operators needed floor/ceil policies or larger KRW units for settlement checks.

## Scope

### In Scope

- settlement rounding input in payroll insurance settlement API
  - `settlement.insuranceRounding.mode` (`round`/`floor`/`ceil`)
  - per-component unit KRW
    - `nationalPensionUnitKrw`
    - `healthInsuranceUnitKrw`
    - `longTermCareUnitKrw`
    - `employmentInsuranceUnitKrw`
    - `industrialAccidentUnitKrw`
- service-level deterministic rounding application
  - apply configured rounding to employee/employer NP/HI/LTC/EI/IA components
  - preserve existing cap and monthly-boundary guards
- response explainability for reconciliation
  - `summary.rounding` (mode + units)
  - `summary.rawContributionKrw` (pre-rounding component values)
- admin insurance console wiring
  - rounding mode/unit inputs
  - rounding/raw trace display
- spec/contract/test-cases update and contract version bump (`1.39.0`)
- WI-0259 regression e2e
  - `scripts/tests/e2e-wi0259-payroll-insurance-settlement-rounding-accuracy.test.ts`

### Out of Scope

- year-end settlement formula changes
- new ops scheduler/cron or delivery channel additions
- new preset/import-export layering

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0259-payroll-insurance-settlement-rounding-accuracy.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0184-payroll-insurance-settlement-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
