# WI-0429: Korean Runtime Message and Contract Title Normalization

## Summary
- Goal: remove remaining English leakage in Korean runtime surfaces for withholding, payslip, and contracts.
- Scope:
  - strengthen Korean runtime message normalization in:
    - `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
    - `src/app/employee/payslips/page-locale-helpers.ts`
    - `src/components/payslip-receipts/runtime-copy-helpers.ts`
    - `src/components/contracts/http.ts`
  - harden Korean contract title normalization in:
    - `src/components/contracts/runtime-copy-helpers.ts`
  - avoid English filename exposure in Korean contract evidence loaded toast in:
    - `src/components/contracts/EmployeeContractsInbox.tsx`

## Delivery
- Added known English runtime-pattern to Korean-message mapping for common failures:
  - employee/organization required
  - session unauthorized/expired
  - permission denied
  - validation/input error
  - generic request/load/network failures
- Expanded contract title fallback normalization for Korean locale:
  - mixed Hangul + English contract keywords now collapses to deterministic Korean fallback title.
- Added regression test:
  - `scripts/tests/e2e-wi0429-korean-runtime-message-and-contract-title-normalization.test.ts`

## Validation
- [x] Korean runtime mapping patterns are present across withholding/payslip/contracts surfaces.
- [x] Contract title normalization includes keyword/rule-based fallback hardening.
- [x] Contracts inbox Korean evidence load message does not append raw English filename.
- [x] Roadmap updated with WI-0429 entry.
