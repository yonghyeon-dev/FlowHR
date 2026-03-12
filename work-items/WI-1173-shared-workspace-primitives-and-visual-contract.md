# WI-1173: 공통 워크스페이스 프리미티브와 시각 계약 정리

## 이유

V2 셸이 들어온 뒤에도 route-first 작업면마다 header, summary, split layout, empty state, feedback를 제각각 구현하고 있다. 이 상태로 다음 파동을 계속 진행하면 화면마다 다시 stale contract가 생긴다.

## 범위

1. 공통 workspace header, tabs, summary, split-layout, empty-state, feedback primitive 도입
2. admin dense mode와 employee light mode가 같은 제품 계약 위에서 동작하도록 공통 shell 규칙 정리
3. 대표 route-first workspaces에 공통 primitive 적용

## 완료 조건

1. representative admin/employee route-first surfaces가 shared workspace primitive를 사용한다.
2. summary-only, queue-first, detail-panel, empty-state, feedback 표현이 한 계약 위에서 정리된다.
3. 이후 visual rollout WI는 legacy panel bundle 대신 shared primitive contract를 기준으로 이어진다.
