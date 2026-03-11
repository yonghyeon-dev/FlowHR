# WI-1134: 관리자 급여 대시보드 dead props 정리

## 배경

`WI-1133`로 관리자 대시보드의 급여 영역은 route-first 카드로 바뀌었지만, `AdminCompensationPanels`와 `page-panels`에는 예전 `AdminPayrollPanel` 시절의 preview/confirm 입력 props와 actions가 그대로 남아 있습니다.

- 대시보드에서 더 이상 사용하지 않는 급여 입력 상태와 action wiring이 남아 있어 구조가 오해를 부릅니다.
- 실제 급여 preview/confirm 작업은 `/admin/payroll-close/preview-builder` 전용 작업면에서만 수행합니다.
- 이번 단계에서는 대시보드 렌더 트리에서 dead props/actions를 잘라, route-first 구조와 코드 경계를 일치시켜야 합니다.

## 목표

1. `AdminCompensationPanels`에서 사용하지 않는 급여 preview/confirm props와 actions를 제거합니다.
2. `page-panels.tsx`에서 해당 dead wiring을 더 이상 전달하지 않게 합니다.
3. 관련 정적 회귀 가드를 새 구조 기대값으로 보정합니다.

## 범위

- `src/app/admin/page-compensation-panels.tsx`
- `src/app/admin/page-panels.tsx`
- `scripts/tests/e2e-wi0412-admin-dashboard-action-compensation-panel-extraction.test.ts`
- `scripts/tests/e2e-wi1134-admin-payroll-dashboard-dead-props-prune.test.ts`
- `docs/production-operating-progress.md`

## 범위 제외

- `useAdminDashboardState`에서 급여 preview 입력 상태를 제거하는 larger state split
- `/admin/payroll-close/preview-builder` 전용 상태 훅 분리

## 완료 조건

1. 관리자 대시보드의 `AdminCompensationPanels` prop 타입에서 사용하지 않는 급여 preview/confirm props가 제거됩니다.
2. `page-panels.tsx`는 더 이상 `onPreviewPayroll`, `onConfirmPayroll`, preset-share reset/reapply, 수동 항목 초기화 등을 대시보드 보상 패널에 전달하지 않습니다.
3. 정적 회귀 가드가 이 구조 변경을 반영하고 통과합니다.
