# WI-1181: 고객 관리자와 ops 경계 강제

ops-only 와 customer-admin surface 를 명시적으로 분리해 내부 운영 개념이 고객 제품 구조를 흔들지 않게 한다.

## Scope

1. hidden ops route 정책 재정리
2. customer-facing navigation 에서 ops 흔적 제거
3. internal-only 표면의 copy 와 접근 경계 정리

## Acceptance Criteria

1. ops-only surface 는 더 이상 customer product IA 를 오염시키지 않는다.
2. customer-admin 표면은 internal tool 느낌을 줄인다.
3. route policy 가 문서와 구현에서 일치한다.
