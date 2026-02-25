# WI-0485: Payroll Accuracy Regression Bundle and Admin Evidence Panel

## Summary
- Goal: provide admin-facing calculation confidence evidence for year-end payroll workflows and lock key arithmetic invariants via regression.
- Scope:
  - `src/components/payroll-year-end/accuracy-evidence.ts`
  - `src/components/payroll-year-end/PayrollAccuracyEvidencePanel.tsx`
  - `src/components/payroll-year-end/PayrollYearEndConsole.tsx`
  - `src/components/payroll-year-end/copy.ts`
  - `scripts/tests/e2e-wi0485-payroll-accuracy-regression-bundle-and-admin-evidence.test.ts`
  - `ROADMAP.md`

## Delivery
- Added payroll accuracy evidence helper (`accuracy-evidence.ts`) that evaluates invariants for:
  - Settlement: gross/net balance, deduction component balance, withholding delta, due/refund exclusivity, tax-credit cap balance.
  - Recalculation: taxable-income deduction balance, tax-liability delta, withholding-delta change, taxable-income reduction.
  - Insurance reconciliation: status/delta consistency and monthly sum balance.
- Added `PayrollAccuracyEvidencePanel` and integrated it into `/admin/payroll-year-end`.
  - Panel shows pass/fail summary and per-check detail evidence.
- Added locale copy keys (`ko/en`) for the new evidence panel and check labels.
- Added regression test to lock helper invariants and UI wiring anchors.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0485-payroll-accuracy-regression-bundle-and-admin-evidence.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0260-payroll-year-end-deduction-cap-accuracy.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0261-payroll-year-end-tax-credit-cap-accuracy-v1.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0264-payroll-year-end-withholding-delta-breakdown-ux.test.ts`
- [x] `npm.cmd run -s test`
- [x] `npm.cmd run -s test:integration`
- [x] `npm.cmd run -s lint`
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd run -s prisma:validate`
