# WI-0501: Payroll Accuracy Evidence Fail-First Filter and JSON Export

## Summary
- Goal: improve payroll year-end action speed by surfacing failed checks first and allowing direct evidence export from `/admin/payroll-year-end`.
- Scope:
  - `src/components/payroll-year-end/PayrollAccuracyEvidencePanel.tsx`
  - `src/components/payroll-year-end/PayrollYearEndConsole.tsx`
  - `scripts/tests/e2e-wi0501-payroll-accuracy-evidence-fail-first-and-json-export.test.ts`
  - `ROADMAP.md`

## Delivery
- Added fail-first ordering in payroll accuracy evidence checks.
- Added default fail-only view toggle with switch to all checks.
- Added evidence JSON download action including:
  - generated timestamp
  - current filter mode
  - pass/fail/check counts
  - currently visible checks
- Preserved existing summary and check labels.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0485-payroll-accuracy-regression-bundle-and-admin-evidence.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0501-payroll-accuracy-evidence-fail-first-and-json-export.test.ts`
- [x] `npm.cmd run typecheck`
