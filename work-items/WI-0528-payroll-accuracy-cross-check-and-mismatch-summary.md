# WI-0528: Payroll Accuracy Cross-Check and Mismatch Summary

## Summary
- Goal: strengthen year-end evidence reliability by adding a settlement/recalculation baseline cross-check and surfacing mismatch summary in UI.
- Scope:
  - `src/components/payroll-year-end/accuracy-evidence.ts`
  - `src/components/payroll-year-end/PayrollAccuracyEvidencePanel.tsx`
  - `src/components/payroll-year-end/copy.ts`
  - `scripts/tests/e2e-wi0528-payroll-accuracy-cross-check-and-mismatch-summary.test.ts`
  - `ROADMAP.md`

## Delivery
- Added new evidence check: `settlement_recalculation_baseline_balance`.
- Added cross-check generation when both settlement and recalculation payloads are available.
- Added mismatch summary line in evidence panel:
  - shows all failed check labels
  - shows all-balanced message when no mismatch exists
- Expanded copy map with the new check label for `ko`/`en`.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0501-payroll-accuracy-evidence-fail-first-and-json-export.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0528-payroll-accuracy-cross-check-and-mismatch-summary.test.ts`

