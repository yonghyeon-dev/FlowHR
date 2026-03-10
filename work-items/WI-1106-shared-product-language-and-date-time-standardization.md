# WI-1106: 공통 제품 언어 및 날짜 시간 표준화

## Background

- `WI-1105`에서 공통 피드백과 확인 프리미티브 기준을 먼저 고정했다.
- 다음 단계에서는 그 프리미티브와 워크스페이스가 같은 제품 언어와 날짜/시간 표현을 공유해야 한다.
- 현재 FlowHR는 상태 라벨, 날짜/시간, 안내 문구가 화면별로 흩어져 있어 동일한 상태도 다른 목소리로 보인다.

## Scope

- 공통 상태 라벨, 날짜/시간 포맷, 회복형 오류 문구 기준을 정리한다.
- shared product-language 계층이 어떤 역할을 맡아야 하는지 정리한다.
- admin/employee 공통 제품 언어 원칙과 역할별 차이를 정리한다.
- `docs/shared-product-language-and-date-time-standardization.md`를 추가한다.
- 다음 구현 slice가 어떤 화면부터 적용할지 우선순위를 남긴다.

## Acceptance Criteria

1. 공통 제품 언어와 날짜/시간 표준화 범위가 명확하다.
2. 다음 구현 WI가 어떤 헬퍼와 표준을 도입해야 하는지 알 수 있다.
3. UI 프리미티브와 언어 시스템의 연결 지점이 설명된다.
4. 다음 `WI-1107` IA 구현이 어떤 언어 규칙을 따라야 하는지 입력값이 정리된다.

## Verification

- `docs/shared-feedback-and-confirmation-primitives.md`
- `docs/ui-ux-first-refactor-blueprint.md`
- `docs/shared-product-language-and-date-time-standardization.md`가 상태 라벨, 날짜/시간, 회복형 오류, 역할 호칭, 첫 적용 대상까지 포함한다.
