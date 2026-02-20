# WI-0147: Employee Self-Service UX Phase 8 - History Sort Accuracy, Delay Risk Prediction, Mobile Follow-up Recommendation

## Background and Problem

`/employee` already includes request search/sort, wait prediction, and mobile follow-up guide (WI-0142).

Employees still need a stronger post-submit decision layer:

- they can sort request history, but there is no explicit accuracy feedback for whether the top rows match follow-up intent
- wait prediction exists, but delay risk severity is not summarized as a dedicated risk score panel
- mobile users need recommendation-oriented next actions based on combined sort accuracy + delay risk signals

This WI adds phase-8 follow-up support focused on sort accuracy visibility, delay-risk prioritization, and mobile recommendation execution.

## Scope

### In Scope

- Add request history sort-accuracy feedback section in `/employee`
  - score cards for pending-first, latest-first, and status-cluster alignment
  - severity (`normal`/`watch`/`critical`) based on top-row alignment score
  - quick jump action to related request board
  - section anchor: `#request-history-sort-accuracy`
- Add approval delay-risk prediction feedback section
  - risk cards for overall, attendance, and leave pending queues
  - risk score + stalled/critical counts + ETA guidance
  - quick jump action to related sections
  - section anchor: `#approval-delay-risk-prediction`
- Add mobile follow-up recommendation section
  - card-based next actions from sort-accuracy risk, delay risk, resubmit status, and API recovery state
  - one-tap recommendation action routing
  - section anchor: `#mobile-follow-up-recommendation`
- Add employee sidebar anchors for all new sections
- Add WI-0147 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Employee checks sort-accuracy cards to confirm whether current request history ordering matches follow-up intent.
2. Employee reviews delay-risk prediction cards and prioritizes pending requests with high risk score.
3. Employee executes one-tap mobile recommendations to move directly to the next follow-up action.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove history sort-accuracy, delay-risk prediction, and mobile follow-up recommendation sections.
- Remove added employee sidebar anchors and related styles.
- Remove WI-0147 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Request history sort-accuracy cards render score/severity/detail with quick jump actions.
- [x] Delay-risk prediction cards render risk score/severity/ETA with channel-level summary.
- [x] Mobile follow-up recommendation cards render and execute one-tap actions.
- [x] Employee sidebar includes new WI-0147 anchors.
- [x] WI-0147 e2e is added and included in MVP/FULL suites.
