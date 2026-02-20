# WI-0143: Admin Approval Queue UX Phase 6 - Search/Sort, Processing Prediction, Mobile Follow-up Guide

## Background and Problem

`/admin` approval queue already includes evidence comparison, SLA alert rules, and mobile checklist (WI-0141).

Operators still need one more execution layer for rapid triage:

- queue filters exist, but there is no dedicated cross-queue search/sort board for fast targeting
- SLA status is visible, but there is no direct "how long until clear" prediction feedback
- mobile operators need explicit post-review follow-up actions, not just readiness checks

This WI adds phase-6 execution support focused on targeting speed, prediction clarity, and mobile follow-up.

## Scope

### In Scope

- Add approval queue search/sort section in `/admin`
  - unified rows across attendance/leave/payroll pending queues
  - search scope (`all`, `queue`, `employee`, `request_id`, `detail`)
  - sort options (`priority_desc`, `wait_desc`, `recent_desc`, `employee_asc`, `queue_asc`)
  - quick pending/urgent/reset actions
  - section anchor: `#approval-search-sort`
- Add approval processing prediction feedback section
  - queue clear-time prediction cards from pending volume + oldest wait + recent success ratio
  - severity (`normal`/`watch`/`critical`) and ETA feedback
  - quick jump action to related sections
  - section anchor: `#approval-processing-prediction`
- Add mobile follow-up action guide section
  - follow-up cards for critical triage, search miss, prediction, and selection sync
  - one-tap section jump for each follow-up action
  - section anchor: `#approval-mobile-follow-up-guide`
- Add admin sidebar anchors for all new sections
- Add WI-0143 e2e and wire to MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. 관리자가 큐 전체에서 대기 건을 검색/정렬해 우선 처리 대상을 빠르게 찾는다.
2. 관리자가 처리 예측 피드백으로 큐 소진 시간과 위험도를 보고 우선순위를 조정한다.
3. 모바일 운영자가 후속 액션 가이드에서 다음 작업으로 한 번에 이동해 처리한다.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove queue search/sort, processing prediction, and mobile follow-up guide sections.
- Remove added admin sidebar anchors and related styles.
- Remove WI-0143 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Queue search/sort rows are computed/rendered with scope/sort controls and quick actions.
- [x] Processing prediction cards render severity/ETA/detail and section jump actions.
- [x] Mobile follow-up guide renders post-review action cards and one-tap routing.
- [x] Admin sidebar includes new anchors.
- [x] WI-0143 e2e is added and included in MVP/FULL suites.
