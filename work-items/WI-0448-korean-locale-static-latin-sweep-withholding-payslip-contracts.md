# WI-0448: Korean Locale Static Latin Sweep (Withholding/Payslip/Contracts)

## Summary
- Goal: 원천징수/명세서/전자계약 한국어 카피 영역에서 잔존 영어 문자열을 정적 회귀로 차단한다.
- Scope:
  - ko copy 블록 전수 스캔 테스트 추가
  - 허용 토큰 최소화(`FlowHR`만 허용)
  - 문서/로드맵 반영

## Delivery
- Added `scripts/tests/e2e-wi0448-korean-locale-static-latin-sweep-withholding-payslip-contracts.test.ts`
  - 대상 파일:
    - `src/components/withholding-receipt/copy-runtime.ts`
    - `src/components/payslip-receipts/copy.ts`
    - `src/components/contracts/copy.ts`
    - `src/components/contracts/journey-copy.ts`
    - `src/app/employee/payslips/page-locale-search-sort-copy.ts`
    - `src/app/employee/payslips/page-locale-page-copy.ts`
  - ko 블록 문자열에서 예상치 못한 라틴 토큰 검출 시 실패.

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0448-korean-locale-static-latin-sweep-withholding-payslip-contracts.test.ts`
