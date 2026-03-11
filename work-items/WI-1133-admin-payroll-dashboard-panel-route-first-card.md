# WI-1133: 관리자 급여 대시보드 패널 route-first 카드 전환

## 배경

`WI-1132`로 관리자 급여 프리뷰 공유 재생이 `/admin/payroll-close/preview-builder` 전용 경로를 갖게 됐지만, 관리자 대시보드의 보상 영역은 아직 전체 `AdminPayrollPanel`을 직접 품고 있습니다.

- 대시보드는 요약과 진입 허브여야 하는데, 급여 프리뷰/확정 폼이 그대로 남아 있어 route-first shell 원칙과 충돌합니다.
- 급여 상세 작업은 이미 `/admin/payroll-close`, `/admin/payroll-close/previewed`, `/admin/payroll-close/preview-builder`로 나뉘기 시작했습니다.
- 이번 단계에서는 대시보드에서 급여 폼을 걷어내고, 전용 작업면으로 보내는 카드형 진입점만 남겨야 합니다.

## 목표

1. 관리자 대시보드의 급여 영역을 전용 워크스페이스 진입 카드로 교체합니다.
2. 카드에서 `payroll close`, `preview builder`, `previewed queue` 전용 경로로 이동할 수 있게 합니다.
3. 기존 정적 회귀 가드를 새 route-first 구조 기대값으로 맞춥니다.

## 범위

- `src/components/admin-dashboard/AdminPayrollWorkspaceCard.tsx`
- `src/app/admin/page-compensation-panels.tsx`
- `scripts/tests/e2e-wi0305-admin-employee-page-decomposition-phase2.test.ts`
- `scripts/tests/e2e-wi0412-admin-dashboard-action-compensation-panel-extraction.test.ts`
- `scripts/tests/e2e-wi1133-admin-payroll-dashboard-route-first-card.test.ts`
- `docs/production-operating-progress.md`

## 범위 제외

- 관리자 대시보드 state/action에서 남은 급여 preview/confirm 입력 상태 제거
- `/admin/payroll-close` 내부 폼 분해
- 급여 확인(confirm) 전용 세부 경로 추가

## 완료 조건

1. `AdminCompensationPanels`가 더 이상 `AdminPayrollPanel`을 직접 렌더링하지 않습니다.
2. 대시보드에는 급여 요약/선택 대상/전용 경로 CTA만 있는 카드가 노출됩니다.
3. 새 정적 회귀 가드가 추가되고, 기존 decomposition 가드도 새 구조 기대값으로 통과합니다.
