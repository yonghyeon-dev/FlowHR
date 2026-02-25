# WI-0465: Korean Runtime Fetch-Failure Guard (Withholding/Payslip/Contracts)

## Summary
- Goal: Block remaining Korean-runtime English leakage for common fetch/network failure diagnostics.
- Scope:
  - Expand `ko` runtime error pattern coverage for fetch/connection failures.
  - Keep `en` runtime behavior unchanged.
  - Add regression test that executes runtime normalizers directly.

## Delivery
- Updated runtime pattern coverage in:
  - `src/components/payslip-receipts/runtime-copy-helpers.ts`
  - `src/app/employee/payslips/page-locale-runtime.ts`
  - `src/components/withholding-receipt/copy-runtime.ts`
  - `src/components/contracts/http.ts`
- Added fetch/network failure patterns:
  - `failed to fetch|fetch failed`
  - `econnreset|econnrefused|enotfound|getaddrinfo`
- Added `scripts/tests/e2e-wi0465-korean-runtime-fetch-failure-guard-withholding-payslip-contracts.test.ts`
  - Verifies pattern presence in all four modules.
  - Verifies Korean runtime returns Hangul message for fetch/connection failures.
  - Verifies English runtime still returns original message.

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0465-korean-runtime-fetch-failure-guard-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0462-korean-runtime-message-guard-withholding-payslip-contracts.test.ts`
