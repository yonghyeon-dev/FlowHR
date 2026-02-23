# WI-0233: Payroll KR Preset Share-Link Validation Feedback UX

## Background

WI-0232 auto-applied preset share-link query values into `/admin` payroll statutory preview inputs, but
operators still lacked explicit feedback about which values were applied and which malformed/unsupported
query values were ignored.

## Scope

### In Scope

- Add deterministic share-link feedback panel on `/admin` payroll statutory preview surface.
- Display applied values from share query context:
  - `incomeSplitItemPresetId`
  - `taxableIncomeKrw`
  - `nonTaxableIncomeKrw`
- Display ignored invalid query values for unsupported preset IDs and malformed numeric values.
- Extend share-context parser resolution to expose `query` + `invalid` summaries while preserving existing
  parse function compatibility.
- Keep payroll API/server behavior unchanged.
- Update roadmap/spec/tests and add WI-0233 e2e coverage.

### Out of Scope

- Payroll API schema changes.
- Signed share token generation and persistence.

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0233-payroll-kr-preset-share-link-validation-feedback-ux.test.ts`
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
