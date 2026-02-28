# WI-0655 KO Surface One-Shot Sweep and CI Guard

## Summary
- expanded KO surface one-shot guard coverage for withholding/payslips/contracts.
- added a dedicated regression test:
  - `scripts/tests/e2e-wi0655-ko-surface-one-shot-sweep-and-ci-guard.test.ts`
- locked CI `test:e2e:ko-guard` to run:
  - WI-0522 one-shot guard
  - WI-0579 residual token guard
  - WI-0655 extended KO surface guard
- verified KO runtime fallback strings for contract title/evidence file name and withholding activity label fallback.

## Scope
- KO i18n guard hardening only
- no API/schema/contract changes
- no UX flow changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0522-i18n-one-shot-sweep-ci-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0579-korean-residual-one-shot-and-ci-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0655-ko-surface-one-shot-sweep-and-ci-guard.test.ts`
- `npm.cmd run typecheck`
