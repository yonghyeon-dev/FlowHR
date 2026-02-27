# WI-0610: Payroll insurance settlement policy preset auto-selection precision

## Background

`POST /payroll/runs/preview-insurance-settlement` supported manual rate/cap inputs, but operators had
to keep policy-rate/cap values synchronized manually for each period. This risks drift when policy
effective dates change.

## Scope

- Add managed KR insurance policy preset dataset for settlement preview:
  - `insurancePolicyPresetId`
  - `insurancePolicyPresetAuto`
  - `insurancePolicyAsOf` (optional, auto mode only; fallback to `periodEnd`)
- Keep backward compatibility:
  - manual rates/caps continue to work
  - explicit manual rates/caps override preset-derived defaults
- Extend settlement response/audit trace with deterministic policy resolution info:
  - resolved preset metadata
  - auto-selection trace
  - effective rates/caps used for computation
- Update payroll API/contract/spec test-cases and add WI-0610 e2e regression guard.

## Out of Scope

- Admin `/admin/payroll-insurance` UI mode switches for policy presets
- External legal-source ingestion or automatic policy syncing

## Acceptance Criteria

1. Settlement preview accepts `insurancePolicyPresetId` and resolves deterministic preset rates/caps.
2. Settlement preview supports `insurancePolicyPresetAuto` with optional `insurancePolicyAsOf`.
3. `insurancePolicyPresetAuto` + `insurancePolicyPresetId` is rejected as mixed mode.
4. `insurancePolicyAsOf` without `insurancePolicyPresetAuto=true` is rejected.
5. Unknown `insurancePolicyPresetId` is rejected.
6. Response includes policy resolution trace (`policyPreset`, `policyPresetAuto`, `policyRates`, `policyCapsKrw`).
7. Existing WI-0184/WI-0259 flows remain compatible.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0610-payroll-insurance-policy-preset-auto-precision.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0259-payroll-insurance-settlement-rounding-accuracy.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0184-payroll-insurance-settlement-baseline.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
