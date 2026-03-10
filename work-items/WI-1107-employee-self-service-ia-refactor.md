# WI-1107: 직원 셀프서비스 정보구조 1차 리팩토링

## Background

- `WI-1103`에서 첫 IA 리팩토링 seam을 employee shell regrouping으로 고정했다.
- `WI-1104`, `WI-1105`, `WI-1106`에서 공통 workspace, feedback, language 기준을 먼저 깔고 있다.
- 이제 실제 구현 단계에서는 기존 `?focus=` 중심 hidden-subpage 모델을 줄이고 안정적인 employee self-service 진입 구조를 만들어야 한다.

## Scope

- employee shell의 1차 목적지 그룹을 재편한다.
- dashboard shortcut, guide entry, self-service navigation이 같은 목적지 모델을 따르도록 정리한다.
- 기존 hidden-subpage 후보를 route 또는 안정된 workspace state로 승격할 첫 slice를 정한다.

## Acceptance Criteria

1. employee shell의 1차 목적지와 이동 규칙이 구현 단위로 정리된다.
2. 기존 `?focus=` 의존 구조를 줄이는 첫 slice가 명확하다.
3. `WI-1104`~`WI-1106`의 공통 기준이 실제 UI 구현 범위에 연결된다.

## Verification

- `docs/first-ia-refactor-seam-migration-plan.md`
- `docs/shared-workspace-interaction-contract.md`
- `docs/shared-feedback-and-confirmation-primitives.md`
- `docs/shared-product-language-and-date-time-standardization.md`
