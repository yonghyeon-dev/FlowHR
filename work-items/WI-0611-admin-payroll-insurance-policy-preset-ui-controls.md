# WI-0611: Admin payroll-insurance policy preset UI controls

## Background

WI-0610 introduced insurance settlement policy preset resolution on API/service side
(`insurancePolicyPresetId`, `insurancePolicyPresetAuto`, `insurancePolicyAsOf`), but
`/admin/payroll-insurance` still had no direct mode controls for these fields.

## Scope

- Add policy mode controls in `PayrollInsuranceSettlementConsole` input panel:
  - `manual`
  - `preset-id`
  - `preset-auto` (+ optional as-of datetime)
- Wire deterministic payload composition:
  - `insurancePolicyPresetAuto`
  - `insurancePolicyPresetId`
  - `insurancePolicyAsOf`
- Show resolved policy trace in summary panel:
  - preset id/effective date
  - policy rates and caps used for computation
- Add WI-0611 regression guard and update roadmap/spec test-cases.

## Out of Scope

- New backend API fields (already delivered in WI-0610)
- Additional policy preset datasets

## Acceptance Criteria

1. Admin input panel has deterministic policy mode controls (manual/preset-id/preset-auto).
2. Payload wires `insurancePolicyPresetAuto`/`insurancePolicyPresetId`/`insurancePolicyAsOf`
   in mutually exclusive form by UI mode.
3. Summary panel renders policy preset/rate/cap trace from response.
4. Existing insurance settlement flows remain compatible.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0611-admin-payroll-insurance-policy-preset-ui-controls.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0610-payroll-insurance-policy-preset-auto-precision.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0332-admin-payroll-insurance-locale-dynamic-ui-gap-fix-phase9.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
