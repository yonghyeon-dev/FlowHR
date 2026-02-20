# WI-0145: Payslip UX Phase 3 - Search/Sort, Confirmation Prediction, Mobile Follow-up Guide

## Background and Problem

`/employee/payslips` already supports status feedback, compare view, and mobile delivery simulation (WI-0134).

Employees still need one more execution layer to finish the payslip journey quickly:

- there is no integrated search/sort board to target the right confirmed payslip fast
- confirmation timing risk is not summarized as prediction-oriented feedback
- mobile users need explicit post-check follow-up actions in one panel

This WI adds phase-3 payslip UX support focused on targeting speed, prediction clarity, and mobile follow-up routing.

## Scope

### In Scope

- Add payslip search/sort section in `/employee/payslips`
  - search scope (`all`, `run_id`, `period`, `state`)
  - sort option (`latest_desc`, `oldest_asc`, `net_desc`, `gross_desc`)
  - reset/focus/high-net quick actions
  - row-level run selection
  - section anchor: `#payslip-search-sort`
- Add payout confirmation prediction feedback section
  - card-based prediction from selected run availability, confirmation cadence, and mobile delivery readiness
  - severity (`normal`/`watch`/`critical`) and ETA labels
  - section jump action per card
  - section anchor: `#payslip-confirmation-prediction`
- Add payslip mobile follow-up action guide section
  - card-based post-check actions (search/sort, prediction, prepare delivery, failure follow-up, simulation)
  - one-tap action routing for each card
  - section anchor: `#payslip-mobile-follow-up-guide`
- Add employee sidebar anchors for all new payslip sections
- Add WI-0145 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Employee searches and sorts confirmed payslips to find the target statement quickly.
2. Employee checks payout confirmation prediction feedback and jumps to the related section immediately.
3. Employee uses one mobile follow-up guide panel to complete next actions after review.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove payslip search/sort, confirmation prediction, and mobile follow-up guide sections.
- Remove added employee sidebar anchors and related styles.
- Remove WI-0145 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Payslip search/sort rows are computed/rendered with scope/sort controls and quick actions.
- [x] Confirmation prediction cards render severity/ETA/detail with section jump actions.
- [x] Mobile follow-up guide cards render and execute one-tap actions.
- [x] Employee sidebar includes new payslip anchors.
- [x] WI-0145 e2e is added and included in MVP/FULL suites.
