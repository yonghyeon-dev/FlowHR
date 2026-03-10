# WI-1105: 공통 피드백 및 확인 프리미티브 정리

## Background

- `WI-1104`에서 공통 워크스페이스 상호작용 계약을 먼저 고정했다.
- 다음 구현 단계에서는 그 계약을 실제 UI 프리미티브와 시각 규칙으로 내려야 한다.
- 현재 FlowHR는 화면마다 success, warning, error, confirmation, empty-state 표현이 제각각이라 같은 액션도 신뢰감이 다르게 느껴진다.

## Scope

- 공통 피드백 배너, 토스트, 확인 다이얼로그, 빈 상태 프리미티브 기준을 정리한다.
- admin/employee 공용으로 쓸 수 있는 시각 톤과 우선순위 규칙을 정리한다.
- destructive action, success feedback, filtered-empty, recoverable error의 표준 규칙을 정리한다.
- `docs/shared-feedback-and-confirmation-primitives.md`를 추가한다.
- 다음 구현 slice가 어떤 프리미티브부터 실제 컴포넌트화할지 연결 지점을 남긴다.

## Acceptance Criteria

1. 피드백과 확인 패턴의 공통 기준이 문서로 정리된다.
2. 다음 구현 PR이 어떤 프리미티브를 어떤 순서로 도입해야 하는지 명확하다.
3. admin/employee가 서로 다른 밀도를 가지더라도 동일한 제품 언어와 상태 리듬을 공유한다.
4. `WI-1104` 계약과 충돌하지 않고, 다음 `WI-1106`과 `WI-1107` 구현의 입력값으로 사용할 수 있다.

## Verification

- `docs/shared-workspace-interaction-contract.md`
- `docs/ui-ux-first-refactor-blueprint.md`
- `docs/shared-feedback-and-confirmation-primitives.md`가 피드백 타입, 배치, 우선순위, 확인 규칙, 빈 상태 규칙, 첫 적용 대상까지 포함한다.
