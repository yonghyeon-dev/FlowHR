> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0169: Payslip UX Phase 9 - Execution Summary Digest, Delay Backlog Digest, Mobile Follow-up Recommendation Upgrade 5

## Background and Problem

`/employee/payslips` already provides phase-8 UX from WI-0165:

- history sort execution summary cards
- payout delay execution backlog cards
- mobile follow-up recommendation upgrade 4

Users still need a tighter execution digest layer:

- execution summary exists, but digest-level prioritization for rapid follow-up is not isolated
- delay backlog exists, but digest scoring for urgent payout delay actions is not isolated
- recommendation upgrade 4 exists, but it does not route through summary/backlog digest lenses

This WI adds phase-9 payslip UX focused on digest triage and recommendation upgrade 5 routing.

## Scope

### In Scope

- Add `#payslip-history-execution-summary-digest` section in `/employee/payslips`
  - digest cards composed from history execution summary signals
  - digest score/order + one-tap summary digest action
- Add `#payslip-delay-execution-backlog-digest` section in `/employee/payslips`
  - digest cards composed from delay execution backlog signals
  - digest score/order + one-tap backlog digest action
- Add `#payslip-mobile-follow-up-recommendation-upgrade-5` section
  - prioritized recommendations from summary digest, backlog digest, search execution, and delivery recovery
  - one-tap recommendation routing
- Add payslip quick-jump buttons and employee sidebar anchors for new sections
- Add WI-0169 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Employee reviews history execution summary digest and runs high-impact payout follow-up first.
2. Employee triages delay backlog digest and executes urgent payout responses in one tap.
3. Employee runs upgrade-5 recommendations that unify digest/search/delivery recovery signals.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove summary-digest/backlog-digest/recommendation-upgrade-5 sections.
- Remove added payslip quick-jump buttons and employee sidebar anchors.
- Remove WI-0169 e2e wiring from package scripts.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] History execution summary digest cards render and run one-tap actions.
- [x] Delay execution backlog digest cards render and run one-tap actions.
- [x] Recommendation upgrade 5 cards render and route one-tap actions.
- [x] Employee sidebar includes new WI-0169 anchors.
- [x] WI-0169 e2e is added and included in MVP/FULL suites.
