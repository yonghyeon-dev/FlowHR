> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0148: Admin Approval Queue UX Phase 7 - History Sort Accuracy, Delay Risk Prediction, Mobile Follow-up Recommendation

## Background and Problem

`/admin` already supports queue search/sort, processing prediction, and mobile follow-up guide (WI-0143).

Operators still need a sharper execution layer for day-to-day triage:

- search/sort is available, but there is no explicit accuracy feedback for whether top queue rows match intended priority
- processing prediction exists, but delay risk is not summarized as an independent risk-scoring panel
- mobile operators need recommendation-oriented follow-up actions that combine sort accuracy, delay risk, and selection readiness

This WI adds phase-7 queue UX support focused on sort-accuracy confidence, delay-risk prioritization, and recommendation-based mobile follow-up.

## Scope

### In Scope

- Add approval history sort-accuracy section in `/admin`
  - card-based accuracy score for baseline sort models (`priority`, `wait`, `recent`)
  - severity (`normal`/`watch`/`critical`) from top-row match ratio
  - quick jump action to queue search/sort section
  - section anchor: `#approval-history-sort-accuracy`
- Add approval delay-risk prediction section
  - risk cards for overall, attendance, leave, and payroll queue views
  - risk score + watch/critical counts + ETA guidance
  - quick jump action to related sections
  - section anchor: `#approval-delay-risk-prediction`
- Add mobile follow-up recommendation section
  - recommendation cards from sort accuracy risk, delay risk, search miss, and selection integrity state
  - one-tap section routing for each recommendation
  - section anchor: `#approval-mobile-follow-up-recommendation`
- Add admin sidebar anchors for all new sections
- Add WI-0148 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Admin reviews history sort-accuracy cards to verify whether queue top rows reflect the intended triage order.
2. Admin checks delay-risk cards and prioritizes queues with high risk scores and critical wait concentration.
3. Admin executes mobile follow-up recommendations from one panel without navigating multiple sections manually.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove history sort-accuracy, delay-risk prediction, and mobile follow-up recommendation sections.
- Remove added admin sidebar anchors and related styles.
- Remove WI-0148 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] History sort-accuracy cards render score/severity/detail and quick jump actions.
- [x] Delay-risk prediction cards render risk/severity/ETA and channel-level backlog summary.
- [x] Mobile follow-up recommendation cards render and route to related queue sections.
- [x] Admin sidebar includes new WI-0148 anchors.
- [x] WI-0148 e2e is added and included in MVP/FULL suites.
