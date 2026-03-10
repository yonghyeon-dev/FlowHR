# WI-1089: 관리자 급여 운영 세션 문구 후속 정리

## 배경

- 관리자 급여 운영 콘솔 일부가 devtools 문맥에서 여전히 raw 세션 조직/관리자 식별자를 그대로 보여준다.
- 앞선 `WI-1084`로 주요 급여 운영 표면을 정리했지만, leave accrual, payroll close, payslip delivery 콘솔은 세션 연결 상태가 아니라 raw 값 중심 문구가 남아 있다.

## 목표

- 관리자 급여 운영 콘솔의 devtools 세션 문구를 작업 공간/관리자 세션 연결 상태 기반 제품 문구로 통일한다.

## 범위

- `src/components/leave-accrual/LeaveAccrualAutoGrantConsole.tsx`
- `src/components/payroll-close/PayrollClosePeriodConsole.tsx`
- `src/components/payroll-close/copy.ts`
- `src/components/payroll-payslip-delivery/PayrollPayslipDeliveryConsole.tsx`
- `src/components/payroll-payslip-delivery/copy.ts`
- `scripts/tests/e2e-wi1089-admin-payroll-operational-session-copy-follow-up.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. leave accrual, payroll close, payslip delivery 콘솔이 raw 세션 조직/관리자 식별자를 `<code>`로 노출하지 않는다.
2. 해당 콘솔의 devtools 문맥은 `formatWorkspaceConnectionState`, `formatAdminSessionConnectionState` 기반 문구만 사용한다.
3. 급여 운영 copy 파일은 `작업 공간 상태 / 관리자 세션 상태` 및 대응 영문 문구를 사용한다.
4. WI-1089 전용 회귀 가드와 기존 관련 검증이 통과한다.
