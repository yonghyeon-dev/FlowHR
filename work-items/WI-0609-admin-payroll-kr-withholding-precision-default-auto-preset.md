# WI-0609: Admin Payroll KR Withholding Precision Default Auto Preset

## Summary
- Goal: make KR statutory payroll preview use simple-tax-table precision by default in admin flow.
- Scope:
  - `src/app/admin/page-state.ts`
  - `scripts/tests/e2e-wi0283-payroll-admin-preset-auto-resolution-ux-visibility.test.ts`
  - `scripts/tests/e2e-wi0609-admin-payroll-default-kr-auto-preset-precision.test.ts`
  - `specs/payroll/test-cases.md`
  - `work-items/WI-0609-admin-payroll-kr-withholding-precision-default-auto-preset.md`
  - `ROADMAP.md`

## Delivery
- Changed admin payroll state default:
  - `payrollIncomeTaxLookupPresetAuto` now initializes as `true`.
- Kept deterministic payload wiring unchanged:
  - auto mode continues sending `incomeTaxLookupPresetAuto=true`.
  - manual preset id remains excluded while auto mode is enabled.
- Updated WI-0283 regression expectation to reflect new default.
- Added WI-0609 regression guard and payroll test-case coverage for default-auto precision behavior.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0609-admin-payroll-default-kr-auto-preset-precision.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0283-payroll-admin-preset-auto-resolution-ux-visibility.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
