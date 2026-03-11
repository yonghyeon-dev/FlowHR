# WI-1158: 관리자 급여 운영 콘솔 워크스페이스 시각 파동 17

Visual wave 17 for route-first admin payroll operational consoles.

## Background

- `WI-1157`까지 승인 운영 인사이트 묶음이 공통 workspace shell 기준으로 정렬되었다.
- 반면 `payroll-close`, `payroll-payslip-delivery`, `payroll-insurance`, `payroll-year-end preflight` 콘솔은 여전히 legacy `hero + panel-grid` 또는 summary-strip 없는 혼합 패턴을 유지하고 있다.
- 이 네 화면은 관리자 허브에서 반복 진입하는 급여 운영 작업면이므로 같은 route-first workspace shell과 card rhythm으로 묶는 편이 자연스럽다.

## Scope

1. `src/components/payroll-close/PayrollClosePeriodConsole.tsx`를 workspace summary/header rhythm에 맞춘다.
2. `src/components/payroll-payslip-delivery/PayrollPayslipDeliveryConsole.tsx`를 workspace summary/header rhythm에 맞춘다.
3. `src/components/payroll-insurance/PayrollInsuranceSettlementConsole.tsx`와 관련 sections/input panel을 admin workspace shell 기준으로 정렬한다.
4. `src/components/payroll-year-end/PayrollYearEndPreflightConsole.tsx`를 admin workspace shell 기준으로 정렬한다.
5. 정적 회귀 가드를 추가하고 `test:integration`에 연결한다.
6. `docs/production-operating-progress.md`에 `WI-1157` 종료와 `WI-1158` 시작을 반영한다.

## Non-Goals

- 급여/보험/연말정산 도메인 계산식 변경
- API 계약 변경
- employee payroll self-service 화면까지 범위 확장

## Acceptance Criteria

1. 네 콘솔 모두 `workspace-shell admin-workspace-shell`, `workspace-page-header`, `workspace-summary-strip`, `workspace-section-card` 기준을 따른다.
2. 입력/실행 패널은 toolbar card, 로그/가이드 패널은 note card, 결과 패널은 content/detail card 리듬으로 정렬된다.
3. 관리자 허브 복귀 또는 상위 급여 workspace 복귀 동선이 공통 시각 규칙을 따른다.
4. 신규 정적 가드와 `npm run typecheck`, `npm test`, `npm run test:integration`이 green이다.
