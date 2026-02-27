# WI-0579: Korean Residual One-Shot And CI Guard

## Summary
- Goal: close remaining Korean-surface regressions in withholding/payslips/contracts and lock the path with a CI guard.
- Scope:
  - `src/components/contracts/http.ts`
  - `src/app/employee/payslips/page.tsx`
  - `src/components/contracts/template-builder-checklist.tsx`
  - `scripts/tests/e2e-wi0579-korean-residual-one-shot-and-ci-guard.test.ts`
  - `package.json`
  - `ROADMAP.md`

## Delivery
- Fixed contracts runtime ko fallback message corruption in `resolveContractsHttpFallbackMessage`.
- Fixed payslips runtime ko fallback message corruption for session bootstrap errors.
- Removed hardcoded `OK/FAIL` labels from contract template checklist and switched to locale-driven labels.
- Added one-shot residual guard test for withholding/payslips/contracts ko copy and runtime fallback strings.
- Wired the new guard into CI via `test:e2e` -> `test:e2e:ko-guard`.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0579-korean-residual-one-shot-and-ci-guard.test.ts`
- [x] `npm.cmd run typecheck`
