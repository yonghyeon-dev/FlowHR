# WI-1108: 관리자 셸 및 워크스페이스 진입 구조 리팩토링

## Background

- `WI-1107`에서 employee shell의 상위 목적지 모델을 먼저 안정화한다.
- 다음 단계에서는 admin도 dashboard 카드 나열과 혼합된 진입 구조를 `queue/workspace/context` 중심 진입 모델로 정리해야 한다.
- admin shell은 employee보다 밀도가 높지만, 같은 제품 셸 규칙 안에서 동작해야 한다.

## Scope

- admin 상위 진입 구조를 control-tower + stable workspace entry 모델로 재정리한다.
- dashboard shortcut과 실제 workspace route가 같은 제품 목적지 모델을 따르도록 정리한다.
- admin mobile navigation의 우선순위도 같은 기준으로 재검토한다.

## Acceptance Criteria

1. admin shell의 상위 목적지와 진입 규칙이 명확하다.
2. dashboard shortcut이 ad-hoc 링크가 아니라 안정적인 workspace entry로 설명된다.
3. employee shell regrouping 결과와 충돌하지 않는 같은 제품 셸 규칙이 적용된다.

## Verification

- `docs/role-tenant-product-shell-blueprint.md`
- `docs/ui-ux-first-refactor-blueprint.md`
- `docs/first-ia-refactor-seam-migration-plan.md`
