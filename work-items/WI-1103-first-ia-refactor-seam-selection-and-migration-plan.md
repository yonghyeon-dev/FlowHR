# WI-1103: 첫 IA 리팩토링 seam 선정과 이관 계획

## Background

- `WI-1102`에서 역할/테넌트/제품 셸 기준이 고정되면, 다음에는 실제 어떤 seam부터 리팩토링을 시작할지 정해야 한다.
- 현재 후보는 employee shell regrouping, admin shell regrouping, hidden-subpage promotion rules다.

## Scope

- 첫 IA 리팩토링 seam을 하나로 좁힌다.
- 선택 이유, 기대 효과, 리스크, 이관 단계를 문서화한다.
- 이후 구현 WI의 안전한 순서를 정의한다.
- `docs/first-ia-refactor-seam-migration-plan.md`를 추가한다.

## Acceptance Criteria

1. 첫 refactor seam이 하나로 결정된다.
2. 왜 그 seam이 지금 가장 안전하고 가치가 큰지 설명된다.
3. 다음 구현 WI가 그 seam 아래에서 바로 파생될 수 있다.

## Verification

- `docs/role-tenant-product-shell-blueprint.md`와 `docs/ui-ux-first-refactor-blueprint.md`를 기준으로 설명된다.
- `docs/first-ia-refactor-seam-migration-plan.md`가 첫 seam, 기각한 seam, 이관 순서, 다음 구현 WI 연결을 포함한다.
