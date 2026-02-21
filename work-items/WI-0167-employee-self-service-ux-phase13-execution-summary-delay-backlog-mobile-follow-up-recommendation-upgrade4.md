# WI-0167: Employee Self-Service UX Phase 13 - Execution Summary, Delay Execution Backlog, and Mobile Follow-up Recommendation Upgrade 4

## Background and Problem

`/employee` already provides phase-12 UX from WI-0163 and phase-11 execution cards from WI-0159:

- request history sort hardening plus execution cards
- approval delay response execution tracker cards
- mobile follow-up recommendation upgrade 3
- attendance correction / leave forecast / leave calendar insights

Employees still need clearer execution prioritization in the request follow-up lane:

- hardening+ execution cards exist, but no summary-priority layer
- delay-response tracker exists, but backlog urgency by pending volume/response window is not isolated
- recommendation upgrade 3 exists, but does not route through execution summary/backlog lenses

This WI adds phase-13 self-service execution prioritization with summary cards, backlog cards, and recommendation upgrade 4 routing.

## Scope

### In Scope

- Add `#request-history-sort-execution-summary` section in `/employee`
  - summary cards composed from hardening+ execution signals
  - summary score/order + one-tap execution summary action
- Add `#approval-delay-risk-execution-backlog` section in `/employee`
  - backlog cards composed from delay-response execution tracker signals
  - backlog score/order + one-tap backlog response action
- Add `#mobile-follow-up-recommendation-upgrade-4` section
  - prioritized recommendations from execution summary, execution backlog, resubmit readiness, and API recovery
  - one-tap recommendation routing
- Add employee mobile shortcuts and sidebar anchors for new sections
- Add WI-0167 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Employee resolves high-impact request-history execution actions first via summary cards.
2. Employee prioritizes delay execution backlog and runs backlog response from one panel.
3. Employee executes upgrade-4 recommendations that unify summary/backlog/resubmit/recovery signals.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove execution summary/backlog/recommendation-upgrade-4 sections.
- Remove added employee mobile shortcut buttons and sidebar anchors.
- Remove WI-0167 e2e wiring from package scripts.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Request history execution summary cards render and run one-tap actions.
- [x] Approval delay execution backlog cards render and run one-tap actions.
- [x] Recommendation upgrade 4 cards render and route one-tap actions.
- [x] Employee sidebar includes new WI-0167 anchors.
- [x] WI-0167 e2e is added and included in MVP/FULL suites.
