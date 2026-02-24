# WI-0364: Year-end accuracy regression bundle

## Summary
- Added a regression bundle test that validates KR statutory deduction preview math on a deterministic input case.
- Verified key derived outputs (withholding, social insurance, local income tax, taxable income) after phase22 helper extraction.
- Added locale-format regression coverage for KRW formatting helper runtime locale argument.

## Scope
- `scripts/tests/e2e-wi0364-year-end-accuracy-regression-bundle.test.ts`
- `src/features/payroll/service-deduction-statutory-preview-helpers.ts`
- `src/components/withholding-receipt/types.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0364-year-end-accuracy-regression-bundle.test.ts`
- `npm.cmd run -s typecheck`

