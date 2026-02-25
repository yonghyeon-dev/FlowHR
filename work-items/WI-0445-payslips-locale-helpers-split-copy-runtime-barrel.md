# WI-0445: 급여명세서 locale helper 분해 (copy/runtime/barrel)

## Summary
- `page-locale-helpers.ts` 단일 대형 파일을 `copy`/`runtime`/`barrel` 구조로 분해한다.
- 기존 import 경로는 유지해 호출부 변경을 최소화한다.

## Scope
- `src/app/employee/payslips/page-locale-copy.ts` 신규
- `src/app/employee/payslips/page-locale-runtime.ts` 신규
- `src/app/employee/payslips/page-locale-helpers.ts`를 재-export 전용 배럴로 축소

## Acceptance
1. 기존 호출부(`page.tsx`, `page-view.tsx`, `use-payslip-derived-state.ts`)가 경로 변경 없이 동작한다.
2. 배럴 파일은 경량(재-export 전용)으로 유지된다.
3. locale 관련 함수/타입이 copy/runtime 책임으로 분리된다.
