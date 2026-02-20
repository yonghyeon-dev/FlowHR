# WI-0146: Admin People UX Phase 3 - History Search/Sort, Risk Prediction, Mobile Follow-up Guide

## Background and Problem

`/admin/people` already provides directory filters, org chart, employee compare, history highlight cards, and mobile section jump flow (WI-0135).

Operators still need one more execution layer to triage personnel history quickly:

- history is visible but there is no dedicated search/sort board for risk-first targeting
- field highlights exist, but there is no prediction-oriented risk summary for follow-up priority
- mobile operators need explicit post-check action guidance after reviewing history

This WI adds phase-3 people UX support focused on searchability, risk prediction clarity, and mobile follow-up execution.

## Scope

### In Scope

- Add history search/sort section in `/admin/people`
  - search scope (`all`, `action`, `actor`, `field`, `detail`)
  - sort options (`recent_desc`, `oldest_asc`, `change_count_desc`, `risk_desc`)
  - risk-only toggle and quick reset/risk-first actions
  - section anchor: `#history-search-sort`
- Add history risk prediction feedback section
  - card summary for overall, org/job reassignment, identity changes, and deactivation risk
  - severity (`normal`/`watch`/`critical`) and ETA labels
  - section jump action per card
  - section anchor: `#history-risk-prediction`
- Add people mobile follow-up guide section
  - follow-up cards for search/sort, risk prediction, selected employee history refresh, and risk-first filtering
  - one-tap action routing for each card
  - section anchor: `#people-mobile-follow-up-guide`
- Add admin sidebar anchors for all new people sections
- Add WI-0146 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- ops-only automation expansion

## User Scenarios

1. Admin searches and sorts personnel history to find high-risk changes first.
2. Admin reviews prediction cards to prioritize org/job, identity, and deactivation follow-up.
3. Admin executes mobile follow-up actions from one guide panel without manual multi-step navigation.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove history search/sort, risk prediction, and mobile follow-up guide sections.
- Remove added admin sidebar anchors and related styles.
- Remove WI-0146 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] History search/sort rows are computed/rendered with scope/sort controls and risk-only filtering.
- [x] History risk prediction cards render severity/ETA/detail and section jump actions.
- [x] People mobile follow-up guide cards render and execute one-tap actions.
- [x] Admin sidebar includes new people anchors.
- [x] WI-0146 e2e is added and included in MVP/FULL suites.
