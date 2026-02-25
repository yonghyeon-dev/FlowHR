# WI-0451: Payslips Locale Copy Modular Split (types/search/page/deduction)

## Summary
- Goal: `page-locale-copy.ts` 단일 대형 파일을 목적별 모듈로 분해해 블로트를 줄인다.
- Scope:
  - types/search-sort/page-copy/deduction-copy 모듈 분리
  - 기존 import 경로 호환을 위한 barrel 유지
  - 관련 회귀 테스트 갱신

## Delivery
- Added:
  - `src/app/employee/payslips/page-locale-types.ts`
  - `src/app/employee/payslips/page-locale-search-sort-copy.ts`
  - `src/app/employee/payslips/page-locale-page-copy.ts`
  - `src/app/employee/payslips/page-locale-deduction-copy.ts`
- Updated `src/app/employee/payslips/page-locale-copy.ts`
  - 경량 re-export barrel로 전환.
- Updated regression tests:
  - `scripts/tests/e2e-wi0413-korean-label-normalization-withholding-payslip-contracts.test.ts`
  - `scripts/tests/e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test.ts`
  - `scripts/tests/e2e-wi0445-payslips-locale-helper-split-copy-runtime.test.ts`
  - `scripts/tests/e2e-wi0447-korean-locale-residual-guard-withholding-payslip-contracts-phase2.test.ts`
- Added `scripts/tests/e2e-wi0451-payslips-locale-copy-modular-split-types-search-page-deduction.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0451-payslips-locale-copy-modular-split-types-search-page-deduction.test.ts`
