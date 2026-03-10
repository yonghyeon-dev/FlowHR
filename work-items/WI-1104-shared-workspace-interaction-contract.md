# WI-1104: 공통 워크스페이스 상호작용 계약 정의

## Background

- `WI-1103`에서 첫 IA 리팩토링 seam을 employee shell regrouping으로 고정했다.
- 다음 단계에서는 화면별로 흩어진 loading, empty, success, error, confirm, action-bar 패턴을 공통 워크스페이스 계약으로 정리해야 한다.
- 이 계약이 먼저 있어야 이후 IA 리팩토링과 workspace 구현이 화면별 ad-hoc 수정으로 다시 무너지지 않는다.

## Scope

- 공통 workspace frame 구조를 정의한다.
- loading, empty, success, warning, error, confirmation 상태 계약을 정의한다.
- admin/employee 공통 적용 가능 범위와 역할별 밀도 차이를 문서화한다.
- `docs/shared-workspace-interaction-contract.md`를 추가한다.
- 다음 구현 WI가 이 계약을 기반으로 UI 컴포넌트와 화면 리팩토링을 진행할 수 있게 한다.

## Acceptance Criteria

1. 공통 workspace interaction contract가 문서로 정의된다.
2. 다음 구현 WI가 이 계약을 기준으로 shell/workspace UI를 구현할 수 있다.
3. 화면별 ad-hoc 상호작용을 줄이기 위한 공통 zone, state, behavior 규칙이 명확하다.
4. admin과 employee가 서로 다른 밀도를 가지더라도 같은 제품 시스템 안에서 설명된다.

## Verification

- `docs/ui-ux-first-refactor-blueprint.md`
- `docs/role-tenant-product-shell-blueprint.md`
- `docs/first-ia-refactor-seam-migration-plan.md`
- `docs/shared-workspace-interaction-contract.md`가 workspace frame, 상태 계약, 역할별 밀도, 우선 적용 대상까지 포함한다.
