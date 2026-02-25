# WI-0453: Core Line Budget Guard (Payslip Locale/Scheduling)

## Summary
- Goal: 최근 분해 작업이 회귀되지 않도록 핵심 파일 라인 예산을 자동 검증한다.
- Scope:
  - payslip page/locale/scheduling service line budget 가드
  - 한국어 토큰 정규화 결과 회귀 고정

## Delivery
- Added `scripts/tests/e2e-wi0453-core-line-budget-guard-payslip-locale-scheduling.test.ts`
  - 예산 검증:
    - `src/app/employee/payslips/page.tsx` <= 500
    - `src/app/employee/payslips/page-locale-copy.ts` <= 20
    - `src/app/employee/payslips/page-locale-page-copy.ts` <= 350
    - `src/app/employee/payslips/use-payslip-api.ts` <= 220
    - `src/features/scheduling/service.ts` <= 5500
  - 한국어 copy 토큰 회귀 검증:
    - `예: 조직-00001`
    - `세션 기반 액터 헤더 모드`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0453-core-line-budget-guard-payslip-locale-scheduling.test.ts`
