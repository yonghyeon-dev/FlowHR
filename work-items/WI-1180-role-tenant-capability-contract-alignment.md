# WI-1180: 역할 테넌트 capability 계약 정렬

platform operator, customer admin, employee 의 capability 경계와 tenant membership 표현을 실제 제품 구조와 맞춘다.

## Scope

1. capability bucket 과 화면 ownership 재정의
2. acting role / membership / workspace context 표현 정리
3. customer-admin 와 ops 경계가 흐려지는 route/entry 정리

## Acceptance Criteria

1. 역할과 tenant 문맥이 UI 모델과 로직 모델 모두에서 일관된다.
2. customer-facing shell 에서 ops-only affordance 가 줄어든다.
3. 이후 IA work 가 이 계약을 기준으로 진행된다.
