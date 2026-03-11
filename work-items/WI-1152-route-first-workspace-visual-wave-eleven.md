# WI-1152: 설정 워크스페이스 시각 파동 11

Visual wave 11 for route-first admin and employee settings workspaces.

## Background

- `WI-1142`부터 `WI-1151`까지 공통 workspace 시각 프리미티브를 주요 route-first surfaces에 순차 적용했다.
- settings 영역은 admin과 employee 모두 자주 진입하는 운영 화면이지만 아직 legacy `page-header + panel-grid + panel` 조합과 깨진 한국어 copy가 남아 있다.
- admin settings는 day-2 운영 기본값을 보여주고 employee settings는 언어/알림/계정 설정을 다루므로 안정적인 shell과 명확한 피드백이 필요하다.

## Scope

1. `src/app/admin/settings/page.tsx`를 admin workspace shell 기준으로 정렬하고 깨진 한국어 copy를 정상화한다.
2. `src/app/employee/settings/page.tsx`를 employee workspace shell 기준으로 정렬하고 깨진 한국어 copy를 정상화한다.
3. settings surface 시각 파동 회귀 가드를 추가하고 `test:integration`에 연결한다.
4. `WI-1151` 종료 기록과 `WI-1152` 시작 기록을 진행 문서에 반영한다.

## Non-Goals

- admin settings API 스키마 변경
- employee notification settings storage 정책 변경
- feature management / ops-only controls 구조 변경

## Acceptance Criteria

1. admin settings page가 `workspace-shell`, `workspace-page-header`, `workspace-summary-strip`, `workspace-section-card` 기준을 따른다.
2. employee settings page가 `workspace-shell`, `workspace-page-header`, `workspace-summary-strip`, `workspace-section-card` 기준을 따른다.
3. 두 페이지의 한국어 copy가 깨지지 않고 정상 문자로 보인다.
4. 관련 정적 가드, integration, typecheck, unit 테스트가 green이다.
