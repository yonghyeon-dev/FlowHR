# Payroll Phase 2 Compatibility Matrix

## Intent

This matrix defines how WI-0001 gross-pay behavior coexists with Phase 2 deduction/tax contract rollout.

## Modes

| Mode | Feature Flag | API Surface | Data Fields | Expected Consumer Impact |
| --- | --- | --- | --- | --- |
| Legacy (WI-0001) | `payroll_deductions_v1=off` | `POST /payroll/runs/preview`, `POST /payroll/runs/{runId}/confirm` | `grossPayKrw` only required | No impact |
| Hybrid | `payroll_deductions_v1=on` for selected org | existing + `POST /payroll/runs/preview-with-deductions` | additive deduction/net columns populated when phase2 endpoint used | Existing consumers continue with gross-only path |
| Phase2 Primary | `payroll_deductions_v1=on` default | deduction preview endpoint preferred | deduction and net fields expected for new consumers | Legacy consumers still supported during deprecation window |

## Field Compatibility

| Field | WI-0001 | Phase 2 | Compatibility |
| --- | --- | --- | --- |
| `grossPayKrw` | required | required | stable |
| `withholdingTaxKrw` | absent/null | optional integer | additive |
| `socialInsuranceKrw` | absent/null | optional integer | additive |
| `otherDeductionsKrw` | absent/null | optional integer | additive |
| `totalDeductionsKrw` | absent/null | optional integer | additive |
| `netPayKrw` | absent/null | optional integer | additive |
| `deductionBreakdown` | absent/null | optional JSON | additive |

## Event Compatibility

| Event | WI-0001 | Phase 2 | Compatibility |
| --- | --- | --- | --- |
| `payroll.calculated.v1` | emitted | emitted | stable |
| `payroll.confirmed.v1` | emitted | emitted | stable |
| `payroll.deductions.calculated.v1` | not emitted | emitted on phase2 path | additive |

## Rollout Guardrails

1. Expand-contract only: no breaking mutation of existing endpoints.
2. Gross-only regression suite must remain green in CI.
3. `payroll_deductions_v1` defaults to `off` until consumer validation is complete.
4. Deprecation notice for gross-only integrations must follow `contracts/versioning.md` policy before default switch.
