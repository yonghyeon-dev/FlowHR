# WI-1173: 공통 워크스페이스 프리미티브와 시각 계약 정리

shared workspace header, summary, queue, detail, empty, feedback 를 공통 프리미티브로 묶어 이후 route-first 작업이 화면마다 따로 풀리지 않게 한다.

## Scope

1. 공통 workspace header / status / empty / feedback / split-layout primitive 정리
2. admin dense mode 와 employee light mode 의 같은 제품군 규칙 정의
3. representative workspaces 에 시범 적용

## Acceptance Criteria

1. 새 route-first surface 가 공통 프리미티브를 기반으로 구현된다.
2. summary-only / queue-first / detail-panel 표현이 공유 규칙을 가진다.
3. 이후 WI 가 legacy panel bundle 대신 이 계약을 재사용한다.
