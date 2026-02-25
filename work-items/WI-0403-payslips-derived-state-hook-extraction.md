# WI-0403: Employee Payslips Derived-State Hook Extraction

## Summary
- 목적: `src/app/employee/payslips/page.tsx`의 파생 계산 블록을 분리해 오케스트레이션 중심 구조로 정리.
- 변경:
  - `usePayslipDerivedState` 훅을 추가해 검색/정렬 파생 행, 상태 피드백, 비교 카드, 공제 설명 섹션, 파일명 계산을 이동.
  - `page.tsx`는 상태/액션/렌더 연결 역할만 유지.
  - 기존 회귀 테스트(WI-0319)를 새 구조 기준으로 보정.
  - WI-0403 전용 회귀 테스트 추가(훅 사용/라인수/핵심 로직 이동 검증).
- 효과:
  - `src/app/employee/payslips/page.tsx` 라인 수를 749 -> 517로 감축.
  - 파생 상태 로직 응집도 향상으로 이후 확장 시 page 블로트 재발 위험 감소.

## Scope
- `src/app/employee/payslips/page.tsx`
- `src/app/employee/payslips/use-payslip-derived-state.ts`
- `scripts/tests/e2e-wi0319-employee-payslips-locale-dynamic-residual-gap-fix-phase7.test.ts`
- `scripts/tests/e2e-wi0403-payslips-derived-state-hook-extraction.test.ts`
- `work-items/WI-0403-payslips-derived-state-hook-extraction.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0319-employee-payslips-locale-dynamic-residual-gap-fix-phase7.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0386-employee-payroll-contracts-korean-copy-audit.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0398-payslip-page-view-decomposition-and-render-orchestrator-split.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0403-payslips-derived-state-hook-extraction.test.ts`
- `npm.cmd run build`

