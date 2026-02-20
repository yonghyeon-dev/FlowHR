# WI-0139: Admin Approval Queue UX Phase 4 - Evidence Preview, SLA Timeline, Mobile Bulk Review Sheet

## Background and Problem

`/admin` approval queue already supports focus badges, search/sort filters, bulk prechecks, item history summary, and mobile feedback.

Managers still spend extra taps/time in three moments:

- they must open item rows repeatedly to confirm approval evidence before action
- SLA backlog urgency is visible by chip, but queue-level timeline is not summarized
- mobile bulk action readiness is split across sticky buttons and precheck panel

This WI adds one integrated review layer before bulk actions.

## Scope

### In Scope

- Add approval evidence preview section in `/admin`
  - selected-first card ordering
  - per-item context summary (memo/reason/history/wait hours)
  - queue focus-aware preview cards
- Add queue SLA timeline section
  - bucketed backlog distribution (`<=24h`, `24~48h`, `>48h`)
  - per-queue + all-queue timeline summary
- Add mobile bulk review sheet
  - queue-level ready/blocked state cards
  - direct bulk action buttons for attendance/leave
  - payroll quick focus action
- Add admin sidebar anchors for new sections
  - `#approval-evidence-preview`
  - `#approval-sla-timeline`
  - `#approval-mobile-review-sheet`
- Add WI-0139 e2e and wire to MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- new delivery channels or ops-only feature expansion

## User Scenarios

1. 관리자 입장에서 선택된 승인 건의 근거를 카드로 빠르게 확인하고 일괄 승인/반려를 결정한다.
2. 큐별 SLA 대기 분포를 보고 긴급 누적 구간(48h 초과)을 우선 처리한다.
3. 모바일에서 검토 시트 한 화면으로 실행 가능 여부를 확인하고 즉시 일괄 처리한다.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove evidence preview, SLA timeline, mobile review sheet sections.
- Remove new admin sidebar anchors and styles.
- Remove WI-0139 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Approval evidence preview cards are computed and rendered from current queue/filter/selection.
- [x] Queue SLA timeline is rendered with bucketed distribution and queue-level summary.
- [x] Mobile bulk review sheet shows ready/blocked state and supports direct action triggers.
- [x] Admin sidebar includes anchors for all new sections.
- [x] WI-0139 e2e is added and included in MVP/FULL suites.
