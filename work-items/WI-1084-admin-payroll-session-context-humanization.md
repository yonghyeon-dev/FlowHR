# WI-1084: 관리자 급여 세션 문맥 표면 정리

## 배경

- 급여 보험, 휴가 캘린더, 연말정산, 연말정산 사전점검, 신고 콘솔의 devtools 문맥 줄에 세션 조직 ID와 관리자 액터 ID가 raw 값으로 노출된다.
- `WI-1082`, `WI-1083`에서 관리자 대시보드와 결재 계열은 연결 상태 중심 문구로 정리했으므로, 남은 급여 계열도 같은 기준으로 맞춰야 한다.

## 목표

- 관리자 급여/휴가 캘린더 콘솔의 devtools 세션 문맥을 raw ID 대신 작업 공간 연결 상태와 관리자 세션 연결 상태 문구로 통일한다.

## 범위

- `src/components/payroll-insurance/PayrollInsuranceSettlementInputPanel.tsx`
- `src/components/leave-calendar/LeaveCalendarConsole.tsx`
- `src/components/payroll-year-end/PayrollYearEndConsole.tsx`
- `src/components/payroll-year-end/PayrollYearEndPreflightConsole.tsx`
- `src/components/payroll-year-end-filing/PayrollYearEndFilingConsole.tsx`
- `scripts/tests/e2e-wi1084-admin-payroll-session-context-humanization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 범위에 포함된 관리자 급여/휴가 캘린더 콘솔의 devtools 세션 문맥이 raw ID 대신 연결 상태 문구만 노출한다.
2. 기존 devtools 가시성은 유지되고, raw `<code>{organizationId}</code>` / `<code>{adminActorId}</code>` 노출만 제거된다.
3. 전용 회귀 가드가 추가되고 `test:integration`에 연결된다.
4. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`가 통과한다.
