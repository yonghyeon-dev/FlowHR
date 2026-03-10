# WI-1102: 역할 테넌트 제품 셸 설계 고정

## Background

- FlowHR는 이미 역할 claim과 tenant claim 기준을 일부 갖고 있지만, 실제 제품 표면은 `/admin`, `/employee`, `/ops`가 서로 다른 제품처럼 보이는 구간이 남아 있다.
- 최근 대화와 구조 개편 설계에서 확인된 핵심 모순은 단순 UI 결함보다 `platform operator`, `customer admin`, `employee` 경계가 제품 셸에 명확히 반영되지 않는다는 점이다.
- 다음 IA 리팩토링이 흔들리지 않으려면, 역할/테넌트/제품 셸의 의도된 모델을 먼저 고정해야 한다.

## Scope

- `docs/role-tenant-product-shell-blueprint.md`를 추가한다.
- 역할 계층, tenant context, acting role, capability bucket, shell boundary를 문서화한다.
- 현재 라우트 구조에서 유지 가능한 부분과 반드시 바뀌어야 할 부분을 구분한다.
- 다음 구조 WI가 참조할 첫 안전한 refactor seam을 제시한다.

## Acceptance Criteria

1. `platform operator`, `customer admin`, `employee` 경계가 문서로 명시된다.
2. tenant membership, workspace context, acting role이 제품 개념으로 설명된다.
3. admin shell, employee shell, ops shell의 경계와 역할이 명확하다.
4. 다음 IA 리팩토링이 어느 seam부터 시작해야 하는지 문서만 보고 판단할 수 있다.

## Verification

- `docs/role-tenant-product-shell-blueprint.md`가 현재 claim 문서와 제품 셸 문제를 연결해서 설명한다.
- `docs/ui-ux-first-refactor-blueprint.md`의 상위 구조와 충돌하지 않는다.
