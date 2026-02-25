# WI-0462: Korean Runtime Message Guard (Withholding/Payslip/Contracts)

## Summary
- Goal: Prevent English runtime error text leakage on Korean locale surfaces for withholding, payslip, and contracts journeys.
- Scope:
  - Strengthen runtime error pattern mapping for timeout/server-side failures.
  - Keep fallback behavior deterministic for Korean locale.
  - Add regression test that executes runtime normalizers directly.

## Delivery
- Updated runtime normalizers:
  - `src/components/payslip-receipts/runtime-copy-helpers.ts`
  - `src/app/employee/payslips/page-locale-runtime.ts`
  - `src/components/withholding-receipt/copy-runtime.ts`
  - `src/components/contracts/http.ts`
- Added patterns for:
  - `timeout|timed out|gateway timeout`
  - `internal server error|service unavailable|bad gateway`
- Added `scripts/tests/e2e-wi0462-korean-runtime-message-guard-withholding-payslip-contracts.test.ts`
  - Verifies timeout/server error mappings exist.
  - Verifies runtime normalizers return Hangul messages under `ko` runtime.
  - Verifies `en` runtime keeps original message.

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0462-korean-runtime-message-guard-withholding-payslip-contracts.test.ts`
