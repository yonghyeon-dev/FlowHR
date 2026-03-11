# WI-1148: route-first 워크스페이스 시각 파동 7

Visual wave 7 for route-first admin scheduling and employee schedule workspaces.

## Background
- 공통 workspace 시각 프리미티브가 급여, 공지, 복리후생, 채용 route-first 화면까지 확장됐다.
- 일정 영역은 admin/employee 모두 stable route-first seam 위에 있지만 아직 기존 `hero/panel-grid` 톤과 개별 상태 메시지 표현이 남아 있다.
- scheduling은 조회, 요약, 인시던트, 후속 액션이 함께 보이는 대표 운영/셀프서비스 화면이라 다음 visual wave 대상으로 적합하다.

## Scope
- admin scheduling 화면을 `workspace-shell`, `workspace-page-header`, `workspace-panel-grid`, `workspace-section-card`, `workspace-summary-strip` 패턴에 맞춘다.
- employee schedule 화면을 `employee-workspace-shell`, `workspace-summary-strip`, `workspace-inline-status`, `workspace-section-card` 패턴에 맞춘다.
- 이번 WI는 scheduling 권한, API, 인시던트 동작 로직은 바꾸지 않고 시각 프레임만 정리한다.

## Acceptance Criteria
1. admin scheduling 화면은 공통 admin workspace shell과 summary strip을 사용한다.
2. employee schedule 화면은 공통 employee workspace shell과 summary strip을 사용한다.
3. scheduling 화면의 source/session/status 표면은 공통 workspace banner/status 스타일로 이동한다.
4. 회귀 가드를 추가하고 `npm test`, `npm run typecheck`, `npm run test:integration`을 통과한다.
