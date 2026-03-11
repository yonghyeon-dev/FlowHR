# WI-1149: route-first 워크스페이스 시각 파동 8

Visual wave 8 for route-first admin and employee contracts workspaces.

## Background
- 공통 workspace 시각 프리미티브가 급여, 공지, 복리후생, 채용, 일정 route-first 화면까지 확장됐다.
- 계약 영역은 admin/employee 모두 stable route-first seam 위에 있지만 아직 page-header, summary strip, inline status, section card 톤이 개별 구현으로 남아 있다.
- contracts는 관리자 처리 큐와 직원 응답 화면이 함께 존재해 공통 workspace 시스템을 검증하기 좋은 다음 파동이다.

## Scope
- admin contracts 화면을 공통 admin workspace shell, page header, summary strip, section card 톤에 맞춘다.
- employee contracts 화면을 공통 employee workspace shell, summary strip, inline status, section card 톤에 맞춘다.
- 이번 WI는 계약 승인/응답 로직은 바꾸지 않고 시각 프레임만 정리한다.

## Acceptance Criteria
1. admin contracts 화면은 `workspace-shell`, `workspace-page-header`, `workspace-summary-strip`, `workspace-panel-grid`, `workspace-section-card`를 사용한다.
2. employee contracts 화면은 `employee-workspace-shell`, `employee-workspace-status-header`, `workspace-summary-strip`, `workspace-inline-status`, `workspace-section-card`를 사용한다.
3. 계약 화면의 source hint, status message, KPI strip은 공통 workspace 프리미티브로 정렬된다.
4. 회귀 가드를 추가하고 `npm test`, `npm run typecheck`, `npm run test:integration`을 통과한다.
