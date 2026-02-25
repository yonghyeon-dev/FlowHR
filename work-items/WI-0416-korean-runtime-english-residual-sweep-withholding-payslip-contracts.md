# WI-0416: Korean Runtime English Residual Sweep for Withholding/Payslip/Contracts

## Summary
- Goal: 한국어 런타임에서 동적 원문(영문 에러/사유/제목)이 그대로 노출되는 잔여 경로를 제거합니다.
- Change:
  - `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
    - 원천징수 차단 사유(`blockingReasons`) 한국어 매핑 추가.
    - 세션 오류 원문(영문) 한국어 fallback 정규화.
    - 확정/발급/생성 시각 표시를 runtime locale datetime 포맷으로 통일.
  - `src/app/employee/payslips/page-locale-helpers.ts`
    - `productionNotice.runtimeLabel` 추가(`운영`/`production`).
    - 런타임 진단 메시지 정규화 helper(`normalizeRuntimeDiagnosticMessage`) 공개.
    - 미매핑 명세서 상태 fallback을 한국어(`알 수 없음`)로 고정.
  - `src/app/employee/payslips/page.tsx`, `src/app/employee/payslips/page-view.tsx`
    - Supabase session error 노출 전에 locale 정규화 적용.
    - production 배지 텍스트를 locale copy로 교체.
  - `src/components/contracts/http.ts`
    - `error/message/reason/detail` 키 우선 추출.
    - 런타임 영문 원문 suppress helper(`normalizeContractsErrorMessageForRuntime`) 추가.
  - `src/components/contracts/EmployeeContractsInbox.tsx`, `src/components/contracts/AdminContractsWorkspace.tsx`
    - catch 경로의 에러 문자열 locale 정규화 적용.
    - 한국어 런타임에서 ASCII-heavy 계약 제목 fallback(`계약서 {id-prefix}`) 적용.
- Outcome:
  - 한국어 화면에서 원문 영문 에러/차단사유/일부 제목 잔여 노출을 차단.
  - 동일 경로 재회귀를 막는 WI-0416 테스트 추가.

## Scope
- `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
- `src/app/employee/payslips/page-locale-helpers.ts`
- `src/app/employee/payslips/page.tsx`
- `src/app/employee/payslips/page-view.tsx`
- `src/components/contracts/http.ts`
- `src/components/contracts/runtime-copy-helpers.ts`
- `src/components/contracts/EmployeeContractsInbox.tsx`
- `src/components/contracts/AdminContractsWorkspace.tsx`
- `scripts/tests/e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test.ts`
- `work-items/WI-0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0414-korean-runtime-fallback-guard-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0415-admin-dashboard-state-and-panels-decomposition.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsc -- --noEmit`
