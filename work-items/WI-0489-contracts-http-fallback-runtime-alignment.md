# WI-0489: Contracts HTTP Fallback Runtime Alignment

## Summary
- Goal: align e-contract runtime error guidance for Korean locale by mapping common contract lifecycle failures to readable Korean messages while preserving English runtime behavior.
- Scope:
  - `src/components/contracts/http.ts`
  - `scripts/tests/e2e-wi0489-contracts-http-fallback-runtime-alignment.test.ts`
  - `ROADMAP.md`

## Delivery
- Expanded `koContractsErrorMessagePatterns` with contract-domain lifecycle mappings:
  - approval request/approval state preconditions
  - send preconditions
  - employee response status preconditions
  - expected document hash mismatch
  - manual expire/renew state constraints
  - actor context, datetime format, organization/template/employee lookup failures
  - signed evidence not found
- Preserved runtime fallback behavior:
  - ko runtime: `요청이 실패했습니다 (status)`
  - en runtime: `request failed (status)`
- Added WI-0489 regression test to lock ko/en runtime normalization and readJson fallback messages.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0489-contracts-http-fallback-runtime-alignment.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0462-korean-runtime-message-guard-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd run typecheck`
