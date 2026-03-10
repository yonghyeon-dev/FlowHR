# WI-1105: 공통 피드백 및 확인 프리미티브 정리

## Background

- `WI-1104`에서 워크스페이스 상호작용 계약을 먼저 고정한다.
- 다음 구현 단계에서는 그 계약을 실제 UI 프리미티브로 옮겨야 한다.
- 현재 FlowHR는 화면마다 success, warning, error, confirmation, empty-state 표현이 제각각이라 같은 액션도 신뢰감이 다르게 느껴진다.

## Scope

- 공통 피드백 배너, 토스트, 확인 다이얼로그, 빈 상태 프리미티브 기준을 정리한다.
- admin/employee 공용으로 쓸 수 있는 시각 톤과 우선순위 규칙을 정리한다.
- 첫 적용 대상 workspace를 정하고 다음 구현 slice를 정의한다.

## Acceptance Criteria

1. 피드백과 확인 패턴의 공통 기준이 WI 수준으로 정리된다.
2. 다음 구현 PR이 어떤 프리미티브부터 도입해야 하는지 명확하다.
3. destructive action, success feedback, filtered-empty, recoverable error의 표준화 범위가 정의된다.

## Verification

- `docs/shared-workspace-interaction-contract.md`와 정합성을 가진다.
- 다음 UI 구현 WI에서 바로 참조 가능한 수준으로 정리된다.
