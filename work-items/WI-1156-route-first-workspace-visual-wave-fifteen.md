# WI-1156: 승인 운영 인사이트 워크스페이스 시각 파동 15

Visual wave 15 for route-first admin approval insight workspaces.

## Background

- `WI-1155`까지 관리자 운영 인사이트 화면 중 `reports`, `audit-logs`가 공통 workspace shell 기준으로 정렬되었다.
- 반면 `approval-history`, `approval-policy`, `approval-templates`는 여전히 구형 `hero + panel-grid` 패턴에 머물러 있다.
- 세 화면은 관리자 허브의 승인 운영 인사이트 묶음이므로 같은 route-first workspace shell 기준으로 시각 언어를 맞춰야 한다.

## Scope

1. `src/app/admin/approval-history/page.tsx`를 admin workspace shell 기준으로 정렬한다.
2. `src/app/admin/approval-policy/page.tsx`를 admin workspace shell 기준으로 정렬한다.
3. `src/app/admin/approval-templates/page.tsx`와 `page-sections.tsx`를 admin workspace shell 기준으로 정렬한다.
4. 공통 source hint, hub return affordance, summary strip, toolbar/note card 리듬을 세 화면에 맞춘다.
5. 정적 회귀 가드를 추가하고 `test:integration`에 연결한다.
6. `docs/production-operating-progress.md`에 `WI-1155` 종료와 `WI-1156` 시작을 반영한다.

## Non-Goals

- 승인 정책/템플릿/이력 API 계약 변경
- 승인 도메인 로직 또는 계산 규칙 변경
- 승인 실행 현황 화면까지 범위 확장

## Acceptance Criteria

1. 세 화면 모두 `workspace-shell admin-workspace-shell`, `workspace-page-header`, `workspace-summary-strip`, `workspace-section-card` 기준을 따른다.
2. 세 화면 모두 `/admin` 허브 복귀 동선을 제공한다.
3. 필터/조회/생성/로그 패널이 toolbar/note/content 카드 리듬 안에 배치된다.
4. 신규 정적 가드와 `npm run typecheck`, `npm test`, `npm run test:integration`이 green이다.
