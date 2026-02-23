# WI-0229: Payroll KR Preset/Manual Consistency UX Guide

## Background

WI-0228 added server dictionary validation guard for split-item payloads, but operators still needed
clear pre-submit guidance in `/admin` to avoid trial-and-error API failures.

## Scope

### In Scope

- Add admin consistency guide panel for taxable/non-taxable manual split-item rows.
- Surface preset/manual mode behavior explicitly:
  - preset selected -> manual rows excluded from payload
  - manual mode -> code/category/amount complete input and dictionary parity required
- Add client preflight consistency guard before statutory preview submit (manual mode only).
- Add manual-row clear action in preset mode.
- Update roadmap/specs/tests for WI-0229.

### Out of Scope

- Payroll API schema changes.
- Dictionary CRUD management and external sync.

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0229-payroll-kr-preset-manual-consistency-ux-guide.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0228-payroll-kr-item-code-dictionary-server-validation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0227-payroll-kr-item-code-autocomplete-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0226-payroll-kr-multi-item-input-table-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0225-payroll-kr-income-split-item-preset-dataset.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0224-payroll-kr-income-split-item-code-category-input.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0223-payroll-kr-taxable-non-taxable-split-rule.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
