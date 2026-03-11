# WI-0231: Payroll KR Preset Payload Copy/Share UX

## Background

WI-0230 added deterministic preset-mode sample payload preview for `/admin`, but operators still needed
faster handoff UX to copy payload snippets and share replay context without manual reformatting.

## Scope

### In Scope

- Extend `PayrollKrIncomeSplitPresetPayloadPreviewPanel` with copy/share actions for preset-mode preview.
- Add copy actions for:
  - request payload sample
  - server template sample
  - combined preview bundle
- Add share action using Web Share API when available, with clipboard fallback.
- Include deterministic share context payload (preset ID + split inputs + `/admin/payroll-close/preview-builder` replay href).
- Keep payroll API/server behavior unchanged.
- Update roadmap/spec/tests and add WI-0231 e2e coverage.

### Out of Scope

- Payroll API schema/contract payload field changes.
- New backend endpoint or persisted share token model.

## Validation

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
