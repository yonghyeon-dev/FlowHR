# WI-1146: route-first 워크스페이스 시각 파동 5

Visual wave 5 for route-first admin and employee benefits workspaces.

## Background
- 공지 파동까지 공통 workspace shell, summary strip, section card 패턴이 admin/employee 공지에 적용됐다.
- 복리후생은 admin과 employee 모두 안정된 route-first 목적지지만 아직 구형 panel 조합에 머물러 있다.
- 복리후생은 요약, 신청/심사, 카탈로그, 상태 피드백이 뚜렷해서 다음 visual wave 대상으로 적합하다.

## Scope
- admin 복리후생 워크스페이스를 공통 workspace shell, header, source banner, section card 패턴으로 맞춘다.
- employee 복리후생 워크스페이스를 employee workspace shell, summary strip, inline status 패턴으로 맞춘다.
- 이번 WI는 복리후생 라우팅/권한/도메인 동작은 바꾸지 않고 시각 프레임만 정리한다.

## Acceptance Criteria
1. admin 복리후생 화면이 `workspace-shell`, `workspace-page-header`, `workspace-panel-grid`, `workspace-section-card`를 사용한다.
2. employee 복리후생 화면이 `employee-workspace-shell`, `employee-workspace-status-header`, `workspace-summary-strip`, `workspace-inline-status`를 사용한다.
3. 복리후생 화면의 source hint와 상태 메시지가 공통 workspace banner/status 슬롯으로 이동한다.
4. 회귀 가드가 추가되고 `typecheck`, `npm test`, `npm run test:integration`이 통과한다.
