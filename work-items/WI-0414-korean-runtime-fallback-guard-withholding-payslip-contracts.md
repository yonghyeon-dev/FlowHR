# WI-0414: Korean Runtime Fallback Guard for Withholding/Payslip/Contracts

## Summary
- Goal: eliminate residual English leak paths in Korean runtime for withholding receipt, payslip detail, and e-contract inbox flows.
- Change:
  - `src/app/employee/payslips/page-locale-helpers.ts`
    - Added locale-aware error normalization for Korean runtime.
    - Suppressed ASCII-heavy raw English error strings with Korean fallback copy.
  - `src/app/employee/payslips/use-payslip-derived-state.ts`
    - Added Korean fallback labels for unknown deduction and tax-credit keys.
    - Removed direct raw key fallback (`mapped?.label ?? key`) in Korean runtime path.
  - `src/components/contracts/http.ts`
    - Added guard to suppress raw English API error payloads in Korean runtime and fallback to localized request-failed copy.
  - `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
    - Added unknown format/content-type locale copy fields.
    - Localized unknown content-type fallback in Korean runtime.
- Outcome:
  - Korean locale surfaces now avoid exposing English-only fallback strings across the targeted three journeys.

## Scope
- `src/app/employee/payslips/page-locale-helpers.ts`
- `src/app/employee/payslips/use-payslip-derived-state.ts`
- `src/components/contracts/http.ts`
- `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
- `scripts/tests/e2e-wi0414-korean-runtime-fallback-guard-withholding-payslip-contracts.test.ts`
- `work-items/WI-0414-korean-runtime-fallback-guard-withholding-payslip-contracts.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0394-korean-copy-terminology-normalization-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0405-payslip-contracts-residual-english-token-cleanup.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0413-korean-label-normalization-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0414-korean-runtime-fallback-guard-withholding-payslip-contracts.test.ts`
- `npm.cmd run -s build`
