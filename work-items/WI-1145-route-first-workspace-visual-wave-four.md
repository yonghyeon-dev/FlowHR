# WI-1145: route-first 워크스페이스 시각 파동 4

Visual wave 4 for route-first admin and employee notice workspaces.

## Background
- `WI-1142`부터 공통 워크스페이스 시각 프리미티브를 route-first 표면에 순차 적용하고 있다.
- 공지 영역은 admin과 employee 모두 안정된 route-first 목적지이지만 여전히 구형 `saas-content + panel-grid + panel` 조합에 머물러 있다.
- 공지 워크스페이스는 shared interaction contract의 대표 사례이므로 다음 시각 파동 대상으로 적합하다.

## Scope
- admin 공지 워크스페이스를 공통 workspace shell, header, source banner, summary strip, section card 패턴에 맞춘다.
- employee 공지 보드를 공통 employee workspace shell, header, summary strip, inline status 패턴에 맞춘다.
- 이번 WI는 공지의 라우팅/권한/도메인 동작은 바꾸지 않고 시각 프레임만 정리한다.

## Acceptance Criteria
1. admin 공지 화면이 `workspace-shell`, `workspace-page-header`, `workspace-panel-grid`, `workspace-section-card`를 사용한다.
2. employee 공지 화면이 `employee-workspace-shell`, `employee-workspace-status-header`, `workspace-summary-strip`, `workspace-inline-status`를 사용한다.
3. 공지 화면의 source hint와 상태 메시지가 공통 workspace banner/status 슬롯으로 이동한다.
4. 회귀 가드가 추가되고 `typecheck`, `npm test`, `npm run test:integration`이 통과한다.
