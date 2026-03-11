# WI-1154: 운영 설정 워크스페이스 시각 파동 13

Visual wave 13 for route-first admin operational settings workspaces.

## Background

- `WI-1153`까지 운영 설정군 일부는 공통 workspace shell 기준으로 정렬됐다.
- 하지만 `operator-alerts`, `notification-defaults`, `approval-escalation-settings`, `leave-promotion-email`은 여전히 legacy `page-header` / `panel-grid` 패턴에 머물러 있다.
- 이 네 화면은 모두 `/admin/settings` 인접 운영 설정이며, 같은 source context와 요약 strip 규칙을 공유해야 한다.

## Scope

1. `src/app/admin/operator-alerts/page.tsx`를 admin workspace shell 기준으로 정렬한다.
2. `src/app/admin/notification-defaults/page.tsx`를 admin workspace shell 기준으로 정렬한다.
3. `src/app/admin/approval-escalation-settings/page.tsx`를 admin workspace shell 기준으로 정렬한다.
4. `src/app/admin/leave-promotion-email/page.tsx`를 admin workspace shell 기준으로 정렬한다.
5. 위 4개 화면의 회귀 가드를 추가하고 `test:integration`에 연결한다.
6. `docs/production-operating-progress.md`에 `WI-1153` 종료와 `WI-1154` 시작 상태를 반영한다.

## Non-Goals

- 운영 설정 API 계약 변경
- 운영 알림 전송 로직 변경
- feature flag, leave policy 자체 정책값 변경

## Acceptance Criteria

1. 네 화면 모두 `workspace-shell admin-workspace-shell`, `workspace-page-header`, `workspace-summary-strip`, `workspace-section-card` 기준을 따른다.
2. 네 화면 모두 `/admin`, `/admin/settings` 복귀 동선을 가진다.
3. 각 화면의 핵심 상태가 상단 summary strip에 노출된다.
4. 정적 회귀 가드, unit, integration, typecheck가 green이다.
