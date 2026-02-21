> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0166: Admin People UX Phase 8 - Execution Summary, Delay Execution Backlog, Mobile Follow-up Recommendation Upgrade 4

## Background and Problem

`/admin/people` already provides phase-7 UX from WI-0162:

- history sort hardening plus execution cards
- history delay risk response execution tracker cards
- mobile follow-up recommendation upgrade 3

Admins still need stronger execution-first prioritization:

- hardening+ execution cards exist, but there is no summary-priority layer
- delay-response execution tracker exists, but backlog urgency across row volume/response window is not isolated
- recommendation upgrade 3 exists, but it does not route through execution summary/backlog lenses

This WI adds phase-8 people UX focused on execution summary, delay execution backlog prioritization, and recommendation upgrade 4 routing.

## Scope

### In Scope

- Add `#history-sort-execution-summary` section in `/admin/people`
  - summary cards composed from hardening+ execution signals
  - summary score/order + one-tap execution summary action
- Add `#history-delay-risk-execution-backlog` section in `/admin/people`
  - backlog cards composed from delay-response execution tracker signals
  - backlog score/order + one-tap backlog response action
- Add `#people-mobile-follow-up-recommendation-upgrade-4` section
  - prioritized recommendations from execution summary, delay backlog, search execution, and selected-employee integrity
  - one-tap recommendation routing
- Add people quick-jump buttons and admin sidebar anchors for new sections
- Add WI-0166 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Admin reviews execution summary cards to apply high-impact history-sort actions first.
2. Admin checks delay execution backlog and runs backlog response actions from one panel.
3. Admin executes upgrade-4 mobile recommendations that unify summary/backlog/search/selection signals.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove execution summary/backlog/recommendation-upgrade-4 sections.
- Remove added people quick-jump buttons and admin sidebar anchors.
- Remove WI-0166 e2e wiring from package scripts.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] History sort execution summary cards render and run one-tap actions.
- [x] Delay risk execution backlog cards render and run one-tap actions.
- [x] Recommendation upgrade 4 cards render and route one-tap actions.
- [x] Admin sidebar includes new WI-0166 anchors.
- [x] WI-0166 e2e is added and included in MVP/FULL suites.
