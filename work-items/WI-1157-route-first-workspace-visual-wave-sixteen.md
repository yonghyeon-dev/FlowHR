# WI-1157: 승인 실행 워크스페이스 시각 파동 16

Visual wave 16 for the route-first admin approval execution workspace.

## Background

- `WI-1156`까지 승인 운영 인사이트의 `approval-history`, `approval-policy`, `approval-templates`가 공통 workspace shell 기준으로 정렬되었다.
- `approval-executions`는 여전히 `hero + panel-grid` 기반 view를 유지하고 있어 같은 승인 운영 인사이트 묶음 안에서 시각 리듬이 어긋난다.
- 승인 실행 현황은 관리자 허브에서 자주 진입하는 핵심 운영 화면이므로 summary strip, source hint, related workspace 동선까지 같은 shell 기준으로 맞춰야 한다.

## Scope

1. `src/app/admin/approval-executions/page-view.tsx`를 admin workspace shell 기준으로 정렬한다.
2. `src/app/admin/approval-executions/page-sections-work-conditions.tsx`를 toolbar card 기준으로 정렬한다.
3. `src/app/admin/approval-executions/page-sections-summary-escalation.tsx`를 summary/note card 기준으로 정렬한다.
4. `src/app/admin/approval-executions/page-sections-queue.tsx`를 list/history/log/related card 기준으로 정렬한다.
5. 정적 회귀 가드를 추가하고 `test:integration`에 연결한다.
6. `docs/production-operating-progress.md`에 `WI-1156` 종료와 `WI-1157` 시작을 반영한다.

## Non-Goals

- 승인 실행 API 계약이나 승인 처리 상태 머신 변경
- 승인 실행 우선순위 계산 변경
- 승인 이외의 인사이트 화면까지 범위 확장

## Acceptance Criteria

1. `approval-executions`가 `workspace-shell admin-workspace-shell`, `workspace-page-header`, `workspace-summary-strip`, `workspace-section-card` 기준을 따른다.
2. 승인 실행 관련 패널이 toolbar / note / content card 리듬 안에서 정렬된다.
3. 관리자 허브 복귀와 관련 승인 워크스페이스 동선이 같은 시각 규칙을 따른다.
4. 신규 정적 가드와 `npm run typecheck`, `npm test`, `npm run test:integration`이 green이다.
