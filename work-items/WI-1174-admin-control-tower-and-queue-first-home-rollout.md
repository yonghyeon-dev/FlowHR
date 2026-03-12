# WI-1174: 관리자 컨트롤 타워와 큐 중심 홈 롤아웃

admin home 을 카드 모음에서 큐 중심 control tower 로 재구성해 실운영 관리자 작업 흐름에 맞춘다.

## Scope

1. today queue, exception monitor, org snapshot, approval funnel 을 V2 control tower 구조로 재구성
2. 사람/운영/급여/문서 lane 으로 이어지는 명확한 entry 정리
3. summary card browsing 보다 actual queue 처리 흐름이 우선되게 조정

## Acceptance Criteria

1. `/admin` 이 customer-admin operating station 처럼 보인다.
2. 상단 entry 와 주요 queue action 이 실제 다음 작업으로 연결된다.
3. 대표 stale dashboard guards 가 새로운 home 구조 기준으로 green 이다.
