# WI-1147: route-first 워크스페이스 시각 파동 6

Visual wave 6 for route-first admin and employee recruitment workspaces.

## Background
- 공지와 복리후생 워크스페이스까지 공통 workspace shell, summary strip, section card 패턴이 확장됐다.
- 채용은 admin과 employee 모두 stable route-first 목적지지만 여전히 구형 panel 조합과 generic 상태 메시지에 머물러 있다.
- 채용은 opening, referral queue, stalled risk가 뚜렷해서 다음 visual wave 대상으로 적합하다.

## Scope
- admin 채용 워크스페이스를 공통 workspace shell, header, source banner, summary strip, section card 패턴으로 맞춘다.
- employee 채용 워크스페이스를 employee workspace shell, summary strip, inline status 패턴으로 맞춘다.
- 이번 WI는 채용 라우팅/권한/도메인 동작은 바꾸지 않고 시각 프레임만 정리한다.

## Acceptance Criteria
1. admin 채용 화면이 `workspace-shell`, `workspace-page-header`, `workspace-panel-grid`, `workspace-section-card`를 사용한다.
2. employee 채용 화면이 `employee-workspace-shell`, `employee-workspace-status-header`, `workspace-summary-strip`, `workspace-inline-status`를 사용한다.
3. 채용 화면의 source hint와 상태 메시지가 공통 workspace banner/status 슬롯으로 이동한다.
4. 회귀 가드가 추가되고 `typecheck`, `npm test`, `npm run test:integration`이 통과한다.
