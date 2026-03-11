# WI-1155: 운영 인사이트 워크스페이스 시각 파동 14

Visual wave 14 for route-first admin operational insight workspaces.

## Background

- `WI-1154`까지 운영 설정 인접 surface는 공통 workspace shell 기준으로 정렬됐다.
- 하지만 `reports`와 `audit-logs`는 여전히 legacy top-level page header와 ad-hoc panel 구조에 남아 있다.
- 두 화면은 관리자 허브에서 반복적으로 들어오는 운영 인사이트 성격의 route라서 같은 visual wave로 묶는 편이 자연스럽다.

## Scope

1. `src/app/admin/reports/page.tsx`를 admin workspace shell 기준으로 정렬한다.
2. `src/app/admin/audit-logs/page.tsx`를 admin workspace shell 기준으로 정렬한다.
3. 두 화면의 summary strip, source hint, hub return affordance를 맞춘다.
4. 정적 회귀 가드를 추가하고 `test:integration`에 연결한다.
5. `docs/production-operating-progress.md`에 `WI-1154` 종료와 `WI-1155` 시작 상태를 반영한다.

## Non-Goals

- 리포트 API 쿼리 계약 변경
- 감사 로그 export 포맷 변경
- approval 계열 인사이트 화면까지 범위 확장

## Acceptance Criteria

1. 두 화면 모두 `workspace-shell admin-workspace-shell`, `workspace-page-header`, `workspace-summary-strip`, `workspace-section-card` 기준을 따른다.
2. 두 화면 모두 `/admin` 복귀 동선을 제공한다.
3. 필터와 데이터 요약이 workspace shell 안에서 일관되게 배치된다.
4. 정적 회귀 가드, unit, integration, typecheck가 green이다.
