# WI-1101: UI UX 중심 운영 전환 재정렬

## Background

- 지금까지 운영 전환 문서는 UI/UX를 중요한 축으로 다뤘지만, 여전히 `마감 트랙` 또는 `마지막 정리 단계`처럼 읽히는 부분이 남아 있었다.
- 최근 대화에서 드러난 핵심 문제는 작은 표면 결함보다 `권한`, `테넌트`, `정보구조`, `ops/customer 경계`가 UI/UX를 흔드는 구조적 모순이라는 점이다.
- 따라서 다음 구현은 더 이상 `UI polish` 누적 방식이 아니라 `UI/UX 중심의 제품 구조 재정렬`을 기준으로 진행되어야 한다.

## Scope

- `CURRENT-GOAL.md`를 UI/UX 중심 기준으로 재작성한다.
- `docs/production-operating-plan.md`를 UI/UX 중심 상위 에픽 구조로 재정렬한다.
- `docs/production-operating-progress.md`의 현재 단계와 다음 큐를 새 기준에 맞게 갱신한다.
- `docs/production-gap-inventory.md`의 UI/UX 추적 기준을 새 상위 구조와 맞춘다.
- `docs/ui-ux-first-refactor-blueprint.md`를 추가해 대분류/중분류/소분류, 모순점, 의존성, 다음 WI 후보를 고정한다.
- 같은 설계서 안에 시각 디자인 방향, 밀도 전략, 모바일 기준, HRWIRE 채택/기각 기준까지 통합한다.

## Acceptance Criteria

1. 기준 문서가 더 이상 UI/UX를 마감 단계로 설명하지 않는다.
2. 권한/테넌트/정보구조 리팩토링이 UI/UX 중심 상위 계획 아래에서 설명된다.
3. 다음 실행 큐가 작은 마감 작업이 아니라 구조 재정렬 순서로 읽힌다.
4. 이후 WI가 어떤 상위 축에 속하는지 문서만으로 바로 판단할 수 있다.
5. 구조 개편 설계가 컴팩트 이후에도 다시 유도 가능한 수준으로 문서화되어 있다.
6. 다음 셸/IA 리팩토링이 구조와 디자인을 따로 떼지 않고 같은 기준으로 진행될 수 있다.

## Verification

- 문서 간 목표, 현재 단계, 다음 큐가 서로 모순 없이 읽힌다.
- `CURRENT-GOAL.md`, `docs/production-operating-plan.md`, `docs/production-operating-progress.md`, `docs/production-gap-inventory.md`가 같은 방향을 가리킨다.
- `docs/ui-ux-first-refactor-blueprint.md`만 읽어도 대분류/중분류/소분류와 다음 구조 개편 WI 후보를 도출할 수 있다.
- `docs/ui-ux-first-refactor-blueprint.md`가 구조, 디자인, 모바일, HRWIRE 반영 규칙을 함께 설명한다.
