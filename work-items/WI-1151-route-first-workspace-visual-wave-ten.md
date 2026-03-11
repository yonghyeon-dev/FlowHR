# WI-1151: 알림 워크스페이스 시각 파동 10

Visual wave 10 for route-first admin and employee notifications workspaces.

## Background

- `WI-1142`부터 `WI-1150`까지 공통 workspace 시각 프리미티브를 representative route-first surfaces에 순차 적용했다.
- notifications 영역은 admin과 employee 모두 stable route surface이지만, 아직 legacy `hero-panel + panel-grid + panel` 조합과 깨진 한국어 copy가 남아 있다.
- 알림은 사용자가 자주 마주하는 작업면이라 visual shell과 상태 피드백 tone을 shared workspace 기준으로 맞출 필요가 있다.

## Scope

1. `src/app/admin/notifications/page.tsx`를 admin workspace shell 기준으로 정렬하고 깨진 한국어 copy를 정상화한다.
2. `src/app/employee/notifications/page.tsx`를 employee workspace shell 기준으로 정렬하고 깨진 한국어 copy를 정상화한다.
3. route-first visual wave 10 회귀 가드를 추가하고 `test:integration`에 연결한다.
4. 진행 문서와 WI 흐름을 현재 기준에 맞게 유지한다.

## Non-Goals

- 알림 API 구조 변경
- 알림 유형 사전 재설계
- 알림 설정 페이지 개편

## Acceptance Criteria

1. admin notifications page가 `workspace-shell`, `workspace-page-header`, `workspace-summary-strip`, `workspace-section-card` 기준을 따른다.
2. employee notifications page가 `workspace-shell`, `workspace-page-header`, `workspace-summary-strip`, `workspace-section-card` 기준을 따른다.
3. 두 페이지의 한국어 copy가 깨지지 않고 정상 문자로 보인다.
4. 관련 정적 가드, integration, typecheck, unit 테스트가 green이다.
