# WI-1150: route-first 워크스페이스 시각 파동 9

Visual wave 9 for route-first admin and employee people workspaces.

## Background

- `WI-1142`부터 `WI-1149`까지 공통 workspace 시각 프리미티브를 payroll, notices, benefits, recruitment, scheduling, contracts까지 확장했다.
- people 영역은 admin과 employee 모두 stable route surface이지만, 아직 legacy `saas-content + page-header + panel-grid` 조합에 머물러 있다.
- 특히 employee people 페이지는 깨진 한글 문자열과 단일 panel 레이아웃이 남아 있어 현재 shell baseline과 시각적으로 맞지 않는다.

## Scope

1. `src/app/admin/people/page-view-layout.tsx`를 admin workspace shell 기준으로 정렬한다.
2. `src/app/employee/people/page.tsx`를 employee workspace shell 기준으로 정렬하고 깨진 한글 copy를 정상 제품 언어로 교체한다.
3. route-first visual wave 9 회귀 가드를 추가하고 `test:integration`에 연결한다.
4. 진행 문서에 WI 시작/완료 흐름을 남긴다.

## Non-Goals

- people 도메인의 데이터 모델 변경
- admin people 내부 세부 panel 구조 재작성
- 검색/필터 기능 추가

## Acceptance Criteria

1. admin people layout가 `workspace-shell`, `workspace-page-header`, `workspace-summary-strip`, `workspace-panel-grid` 기준을 따른다.
2. employee people page가 `workspace-shell`, `workspace-page-header`, `workspace-section-card`, `workspace-inline-status` 기준을 따른다.
3. employee people page의 한글 copy가 깨지지 않고 정상 문자열로 보인다.
4. 관련 회귀 테스트와 기존 integration/typecheck/unit이 green이다.
