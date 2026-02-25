# WI-0450: Payslips Page API Hook Extraction and Line Budget 500

## Summary
- Goal: `src/app/employee/payslips/page.tsx`의 API/로그 보일러플레이트를 분리해 라인 예산을 회복한다.
- Scope:
  - `usePayslipApi` 훅 신설
  - `page.tsx`에서 API 호출/로그 상태 관리 제거
  - `page.tsx` 500줄 이하 유지

## Delivery
- Added `src/app/employee/payslips/use-payslip-api.ts`
  - `logs`, `pendingLabel`, `refreshPayslips`, `appendClientLog`, `clearLogs` 제공.
  - bearer/session-header 분기 + API 로그 일관 처리.
- Updated `src/app/employee/payslips/page.tsx`
  - inline `callApi`, `refreshPayslips`, `appendClientLog`, `clearLogs` 제거.
  - 훅 기반으로 호출하도록 전환.
  - copy 액션 로그를 공통 `appendClientLog`로 통일.
- Added `scripts/tests/e2e-wi0450-payslips-page-api-hook-extraction-and-line-budget-500.test.ts`
  - 훅 연결 + inline API 함수 제거 + line budget 검증.

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0450-payslips-page-api-hook-extraction-and-line-budget-500.test.ts`
