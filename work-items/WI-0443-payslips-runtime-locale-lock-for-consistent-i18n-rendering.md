# WI-0443: 급여명세서 런타임 locale lock (혼합 언어 렌더링 방지)

## Summary
- 급여명세서 helper의 런타임 locale 해석에 override를 도입한다.
- 페이지 진입 시 `useI18n()` locale 기반으로 runtime locale을 고정해 포맷/오류문구가 일관되게 렌더링되도록 한다.

## Scope
- `src/app/employee/payslips/page-locale-runtime.ts`: `setPayslipRuntimeLocale` 추가
- `src/app/employee/payslips/page-locale-helpers.ts`: barrel export 추가
- `src/app/employee/payslips/page.tsx`: effect에서 locale lock/unlock 적용

## Acceptance
1. 명세서 페이지에서 locale 변경 시 날짜/금액/오류문구가 동일 locale 기준으로 렌더링된다.
2. runtime locale override가 해제(cleanup)되어 다른 화면으로 누수되지 않는다.
3. 관련 회귀 테스트가 추가된다.
