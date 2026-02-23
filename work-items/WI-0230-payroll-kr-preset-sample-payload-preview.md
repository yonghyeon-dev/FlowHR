# WI-0230: Payroll KR Preset Mode Sample Payload Preview

## Background

WI-0229 introduced preset/manual consistency guidance and client preflight blocking, but operators still
needed a deterministic sample of what request payload shape is sent in preset mode and how server-side
templates are applied.

## Scope

### In Scope

- Add `/admin` preset-mode sample payload preview panel for statutory KR payroll preview.
- Show request payload sample shape when `incomeSplitItemPresetId` is selected.
- Show server template application sample (taxable/non-taxable template code/category and amount rule hints).
- Keep API/server behavior unchanged.
- Update roadmap/spec/tests and add WI-0230 e2e coverage.

### Out of Scope

- Backend/API contract structure changes.
- Preset dictionary CRUD or external sync.

## Validation

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
