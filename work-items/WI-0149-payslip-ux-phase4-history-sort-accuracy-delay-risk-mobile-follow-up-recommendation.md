> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0149: Payslip UX Phase 4 - History Sort Accuracy, Delay Risk Prediction, Mobile Follow-up Recommendation

## Background and Problem

`/employee/payslips` already supports search/sort, confirmation prediction, and mobile follow-up guide (WI-0145).

Employees still need a stronger decision layer after basic checks:

- search/sort exists, but there is no explicit sort-accuracy feedback to validate top-row ordering quality
- confirmation prediction exists, but payout delay risk is not summarized as a dedicated risk panel
- mobile users need recommendation-oriented actions that combine sort-accuracy and delay-risk signals

This WI adds phase-4 follow-up support focused on sort-accuracy confidence, delay-risk prioritization, and recommendation-based mobile execution.

## Scope

### In Scope

- Add payslip history sort-accuracy section in `/employee/payslips`
  - score cards for baseline sort models (`latest`, `net`, `gross`)
  - severity (`normal`/`watch`/`critical`) from top-row match ratio
  - quick jump action to payslip search/sort section
  - section anchor: `#payslip-history-sort-accuracy`
- Add payout delay-risk prediction section
  - risk cards for overall confirmed history, active search scope, and selected-run delivery handoff
  - risk score + watch/critical counts + ETA guidance
  - section jump action per card
  - section anchor: `#payslip-delay-risk-prediction`
- Add payslip mobile follow-up recommendation section
  - recommendation cards combining sort accuracy, delay risk, search execution, and delivery handoff state
  - one-tap recommendation action routing
  - section anchor: `#payslip-mobile-follow-up-recommendation`
- Add employee sidebar anchors for all new sections
- Add WI-0149 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Employee checks history sort-accuracy cards to verify whether current payslip ordering supports intended follow-up.
2. Employee reviews payout delay-risk cards and prioritizes actions based on risk score and ETA.
3. Employee executes recommendation cards from one mobile panel without manual section hunting.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove history sort-accuracy, delay-risk prediction, and mobile follow-up recommendation sections.
- Remove added employee sidebar anchors and related styles.
- Remove WI-0149 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] History sort-accuracy cards render score/severity/detail with quick jump actions.
- [x] Delay-risk prediction cards render risk/severity/ETA with count summary.
- [x] Mobile follow-up recommendation cards render and execute one-tap actions.
- [x] Employee sidebar includes new WI-0149 anchors.
- [x] WI-0149 e2e is added and included in MVP/FULL suites.
