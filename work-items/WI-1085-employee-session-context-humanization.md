# WI-1085: 직원 세션 문맥 표면 정리

## 배경

- 직원 대시보드 계정 개요와 직원 연말정산 입력 콘솔의 devtools 문맥 줄에 세션 조직 ID와 직원 ID가 raw 값으로 노출된다.
- 관리자 계열 세션 문맥은 `WI-1082`, `WI-1083`, `WI-1084`에서 연결 상태 중심 문구로 정리했으므로, 직원 계열도 같은 기준으로 맞춰야 한다.

## 목표

- 직원 대시보드와 직원 연말정산 입력 콘솔의 devtools 세션 문맥을 raw ID 대신 작업 공간 연결 상태와 직원 세션 연결 상태 문구로 통일한다.

## 범위

- `src/lib/product-language.ts`
- `src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx`
- `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx`
- `scripts/tests/e2e-wi1085-employee-session-context-humanization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 범위에 포함된 직원 표면의 devtools 세션 문맥이 raw 조직/직원 ID 대신 연결 상태 문구만 노출한다.
2. 직원 세션 연결 상태를 표현하는 공통 헬퍼가 추가되고 두 화면이 같은 표현을 사용한다.
3. 전용 회귀 가드가 추가되고 `test:integration`에 연결된다.
4. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`가 통과한다.
