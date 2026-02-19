# Payroll Phase 2 Compatibility Matrix

## Intent

This matrix defines how WI-0001 gross-pay behavior coexists with Phase 2 deduction/tax contract rollout.

## Modes

| Mode | Feature Flag | API Surface | Data Fields | Expected Consumer Impact |
| --- | --- | --- | --- | --- |
| Legacy (WI-0001) | `payroll_deductions_v1=off` | `POST /payroll/runs/preview`, `POST /payroll/runs/{runId}/confirm` | `grossPayKrw` only required | No impact |
| Hybrid | `payroll_deductions_v1=on` for selected org | existing + `POST /payroll/runs/preview-with-deductions` | additive deduction/net columns populated when phase2 endpoint used | Existing consumers continue with gross-only path |
| Phase2 Primary | `payroll_deductions_v1=on` default | deduction preview endpoint preferred | deduction and net fields expected for new consumers | Legacy consumers still supported during deprecation window |
| Phase2 Profile Mode (WI-0006 + WI-0010) | `payroll_deductions_v1=on` + `payroll_deduction_profile_v1=on` | existing + `GET/PUT /payroll/deduction-profiles/{profileId}` | additive profile trace fields populated when profile mode is used | Manual phase2 consumers remain valid |
| Phase2 KR Statutory Baseline Mode (WI-0101) | `payroll_deductions_v1=on` + `payroll_kr_baseline_v1=on` | existing `POST /payroll/runs/preview-with-deductions` with `deductionMode=statutory_kr_baseline` | additive deduction/net fields populated with KR baseline component breakdown | Manual/profile consumers remain valid |
| Phase2 KR Tax-Credit/Boundary Extension (WI-0106) | `payroll_deductions_v1=on` + `payroll_kr_baseline_v1=on` | same statutory endpoint with additive fields | additive tax-credit and monthly-boundary traces in breakdown JSON | Existing statutory consumers remain valid (all new fields optional) |

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
| `deductionProfileId` | absent/null | optional string | additive |
| `deductionProfileVersion` | absent/null | optional integer | additive |

## Event Compatibility

| Event | WI-0001 | Phase 2 | Compatibility |
| --- | --- | --- | --- |
| `payroll.calculated.v1` | emitted | emitted | stable |
| `payroll.confirmed.v1` | emitted | emitted | stable |
| `payroll.deductions.calculated.v1` | not emitted | emitted on phase2 path | additive |
| `payroll.deduction_profile.updated.v1` | not emitted | emitted on profile configuration update | additive |

## Request Compatibility

| Request Field | WI-0001 | Phase 2 | Compatibility |
| --- | --- | --- | --- |
| `expectedProfileVersion` (profile mode) | absent | optional integer | additive |
| `additionalTaxCreditKrw` (statutory mode) | absent | optional integer | additive |
| `dependentCount` (statutory mode) | absent | optional integer | additive |
| `dependentTaxCreditPerPersonKrw` (statutory mode) | absent | optional integer | additive |
| `requireMonthlyBoundary` (statutory mode) | absent | optional boolean | additive |

## Rollout Guardrails

1. Expand-contract only: no breaking mutation of existing endpoints.
2. Gross-only regression suite must remain green in CI.
3. `payroll_deductions_v1` defaults to `off` until consumer validation is complete.
4. `payroll_deduction_profile_v1` defaults to `off` until profile auth/audit tests are green.
5. `payroll_kr_baseline_v1` defaults to `off` until statutory baseline accuracy tests are green.
6. `expectedProfileVersion` remains optional for backward compatibility; stale mismatch must return `409`.
7. Deprecation notice for gross-only integrations must follow `contracts/versioning.md` policy before default switch.
8. `requireMonthlyBoundary` remains optional (`false` default) for backward compatibility; invalid monthly range must return `400` only when explicitly enabled.
