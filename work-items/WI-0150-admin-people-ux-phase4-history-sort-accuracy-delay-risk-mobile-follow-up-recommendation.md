# WI-0150: Admin People UX Phase 4 - History Sort Accuracy, Delay Risk Prediction, Mobile Follow-up Recommendation

## Background and Problem

`/admin/people` already supports history search/sort, change-risk prediction, and mobile follow-up guide (WI-0146).

Admins still need a stronger follow-up decision layer:

- search/sort exists, but there is no explicit score for whether top history rows align with expected ordering baseline
- risk prediction exists, but delay risk is not summarized as an independent score panel
- mobile operators need recommendation-based actions that combine sort-accuracy and delay-risk signals

This WI adds phase-4 people UX support focused on sort-accuracy confidence, delay-risk prioritization, and recommendation-based mobile execution.

## Scope

### In Scope

- Add history sort-accuracy section in `/admin/people`
  - score cards for baseline sort models (`recent`, `change-count`, `risk-first`)
  - severity (`normal`/`watch`/`critical`) from top-row match ratio
  - quick jump action to history search/sort section
  - section anchor: `#history-sort-accuracy`
- Add history delay-risk prediction section
  - risk cards for overall history, active search scope, and selected employee history
  - risk score + watch/critical counts + ETA guidance
  - section jump action per card
  - section anchor: `#history-delay-risk-prediction`
- Add people mobile follow-up recommendation section
  - recommendation cards combining sort-accuracy risk, delay-risk risk, search execution state, and selected employee readiness
  - one-tap recommendation action routing
  - section anchor: `#people-mobile-follow-up-recommendation`
- Add admin sidebar anchors for all new sections
- Add WI-0150 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Admin checks history sort-accuracy cards to validate whether current ordering supports triage intent.
2. Admin reviews delay-risk cards and prioritizes follow-up by risk score and ETA.
3. Admin runs recommendation cards from one mobile panel without manual section hopping.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove history sort-accuracy, delay-risk prediction, and mobile follow-up recommendation sections.
- Remove added admin sidebar anchors and related styles.
- Remove WI-0150 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] History sort-accuracy cards render score/severity/detail with quick jump actions.
- [x] History delay-risk prediction cards render risk/severity/ETA with count summary.
- [x] Mobile follow-up recommendation cards render and execute one-tap actions.
- [x] Admin sidebar includes new WI-0150 anchors.
- [x] WI-0150 e2e is added and included in MVP/FULL suites.
