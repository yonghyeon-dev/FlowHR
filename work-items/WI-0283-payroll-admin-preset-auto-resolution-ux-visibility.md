# WI-0283: Payroll Admin Preset Auto-Resolution UX Visibility

## Background

WI-0282 added backend support for KR lookup preset auto-selection by effective-date reference
(`incomeTaxLookupPresetAuto`, optional `incomeTaxLookupAsOf`), but `/admin` payroll preview still
exposes only manual preset ID selection. Operators need explicit UI controls to switch between
manual preset mode and auto-resolution mode.

## Scope

### In Scope

- extend `/admin#payroll` statutory preview inputs with:
  - auto mode toggle for `incomeTaxLookupPresetAuto`
  - optional datetime-local input for `incomeTaxLookupAsOf`
- update admin payload wiring:
  - send `incomeTaxLookupPresetAuto` and optional `incomeTaxLookupAsOf` when auto mode is enabled
  - do not send manual `incomeTaxLookupPresetId` when auto mode is enabled
- upgrade `PayrollKrPresetGuidePanel`:
  - show manual vs auto mode guidance (`ko`/`en`)
  - expose selected manual preset summary and auto reference-date behavior hint
- add WI-0283 e2e source-level regression for admin wiring and panel contract
- update payroll test-cases for admin preset auto-mode UX coverage
- update roadmap entry for WI-0283 delivery tracking

### Out of Scope

- API/contract field expansion beyond WI-0282
- new payroll calculation rule changes
- scheduler/ops automation

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0283-payroll-admin-preset-auto-resolution-ux-visibility.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0222-payroll-admin-preset-selector-and-guide.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
