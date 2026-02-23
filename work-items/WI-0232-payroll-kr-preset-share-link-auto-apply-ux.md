# WI-0232: Payroll KR Preset Share-Link Auto-Apply UX

## Background

WI-0231 added preset payload copy/share actions and replay link text, but `/admin` still required operators
to manually re-enter shared query values into payroll statutory preview inputs.

## Scope

### In Scope

- Add share-link query parser for preset payload replay context.
- Auto-apply supported query params on `/admin` payroll surface:
  - `incomeSplitItemPresetId`
  - `taxableIncomeKrw`
  - `nonTaxableIncomeKrw`
- Auto-switch preview mode to `statutory_kr_baseline` when at least one valid shared value exists.
- Ignore invalid preset IDs and malformed numeric values deterministically.
- Keep payroll API/server behavior unchanged.
- Update roadmap/spec/tests and add WI-0232 e2e coverage.

### Out of Scope

- Payroll API schema/contract payload changes.
- Signed share token generation or server persistence.

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0232-payroll-kr-preset-share-link-auto-apply-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0231-payroll-kr-preset-payload-copy-share-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0230-payroll-kr-preset-sample-payload-preview.test.ts`
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
