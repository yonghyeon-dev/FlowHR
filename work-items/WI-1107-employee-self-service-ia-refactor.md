# WI-1107: 직원 셀프서비스 정보구조 1차 리팩토링

## Background

- `WI-1103`에서 첫 IA 리팩토링 seam을 employee shell regrouping으로 고정했다.
- `WI-1104`, `WI-1105`, `WI-1106`에서 공통 workspace, feedback, language 기준을 먼저 깔았다.
- 이제 실제 구현 단계에서는 기존 `?focus=` 중심 hidden-subpage 모델을 줄이고, 안정적인 employee self-service 진입 구조를 만들어야 한다.

## Scope

- employee shell 상위 내비게이션을 다섯 개 목적지 그룹으로 재편한다.
- 상위 셸에서 `?focus=` 및 hash 기반 hidden-subpage 링크를 제거한다.
- 모바일과 데스크톱이 같은 목적지 모델을 따르도록 묶는다.
- 첫 slice에서는 stable route 중심 상위 그룹만 정리하고, hidden-subpage 승격은 후속 slice에서 이어간다.
- 첫 구현 범위는 `Today / Requests / Documents / Notices & Alerts / Account` 다섯 그룹의 셸 재편과 회귀 가드 추가까지로 제한한다.

## Acceptance Criteria

1. employee shell의 상위 내비게이션이 stable destination 그룹으로 재편된다.
2. 상위 셸에서 `?focus=` 링크가 제거된다.
3. 모바일과 데스크톱이 같은 그룹 구조와 언어를 공유한다.
4. 회귀 가드가 추가되어 employee shell이 다시 hidden-subpage 링크 저장소로 돌아가지 않는다.

## Verification

- `npm run typecheck`
- `npx tsx scripts/tests/e2e-wi1107-employee-shell-grouped-navigation.test.ts`
- `npx tsx scripts/tests/e2e-wi0239-responsive-mobile-web-ux-baseline.test.ts`
