# WI-0477: Korean Copy Residual Sweep for Payroll Preset Preview

## Summary
- Goal: remove remaining English copy on Korean locale in payroll preset payload preview.
- Scope:
  - `src/components/payroll/PayrollKrIncomeSplitPresetPayloadPreviewPanel.tsx`

## Delivery
- Added dedicated Korean locale copy block for preset payload preview panel (`ko` no longer points to `defaultCopy`).
- Localized preset-mode omission label and wired request payload preview to locale copy:
  - `presetModeOmittedLabel` added to copy type and both locales.
  - `taxableIncomeItems` / `nonTaxableIncomeItems` now use `copy.presetModeOmittedLabel`.
- Added regression test:
  - `scripts/tests/e2e-wi0477-korean-copy-residual-sweep-payroll-preset-preview.test.ts`

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0477-korean-copy-residual-sweep-payroll-preset-preview.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0448-korean-locale-static-latin-sweep-withholding-payslip-contracts.test.ts`
