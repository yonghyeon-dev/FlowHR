# WI-0165: Payslip UX Phase 8 - Execution Summary, Delay Backlog, Mobile Follow-up Recommendation Upgrade 4

## Background and Problem

`/employee/payslips` already provides phase-7 UX from WI-0161:

- history sort hardening plus execution cards
- payout delay response execution tracker cards
- mobile follow-up recommendation upgrade 3

Employees still need stronger execution-first guidance:

- hardening+ execution cards exist, but there is no summary-priority layer
- delay-response tracker exists, but backlog urgency across row volume/response window is not isolated
- recommendation upgrade 3 exists, but it does not route through execution summary/backlog lenses

This WI adds phase-8 payslip UX focused on execution summary, delay backlog prioritization, and recommendation upgrade 4 routing.

## Scope

### In Scope

- Add `#payslip-history-sort-execution-summary` section in `/employee/payslips`
  - summary cards composed from hardening+ execution signals
  - summary score/order + one-tap execution summary action
- Add `#payslip-delay-risk-execution-backlog` section in `/employee/payslips`
  - backlog cards composed from delay-response execution tracker signals
  - backlog score/order + one-tap backlog response action
- Add `#payslip-mobile-follow-up-recommendation-upgrade-4` section
  - prioritized recommendations from execution summary, delay backlog, search execution, and delivery recovery
  - one-tap recommendation routing
- Add payslip quick-jump buttons and employee sidebar anchors for new sections
- Add WI-0165 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Employee uses execution summary cards to resolve high-impact payslip follow-up items first.
2. Employee reviews payout delay backlog by urgency and runs response actions from one panel.
3. Employee executes upgrade-4 mobile recommendations that unify summary/backlog/search/delivery signals.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove execution summary/backlog/recommendation-upgrade-4 sections.
- Remove added payslip quick-jump buttons and sidebar anchors.
- Remove WI-0165 e2e wiring from package scripts.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Execution summary cards render and run one-tap actions.
- [x] Delay backlog cards render and run one-tap actions.
- [x] Recommendation upgrade 4 cards render and route one-tap actions.
- [x] Employee sidebar includes new WI-0165 anchors.
- [x] WI-0165 e2e is added and included in MVP/FULL suites.
