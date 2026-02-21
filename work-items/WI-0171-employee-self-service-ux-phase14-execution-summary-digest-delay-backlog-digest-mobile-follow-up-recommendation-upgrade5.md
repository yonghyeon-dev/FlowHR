> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0171: Employee Self-Service UX Phase 14 - Execution Summary Digest, Delay Backlog Digest, Mobile Follow-up Recommendation Upgrade 5

## Background and Problem

`/employee` already provides phase-13 UX from WI-0167:

- request history sort execution summary cards
- approval delay risk execution backlog cards
- mobile follow-up recommendation upgrade 4

Employees still need a tighter digest-first execution lane:

- execution summary exists, but digest-level prioritization for fast triage is not isolated
- delay execution backlog exists, but digest scoring for urgent follow-up is not isolated
- recommendation upgrade 4 exists, but it does not route through summary/backlog digest lenses

This WI adds phase-14 self-service UX focused on digest triage and recommendation upgrade 5 routing.

## Scope

### In Scope

- Add `#request-history-execution-summary-digest` section in `/employee`
  - digest cards composed from request history execution summary signals
  - digest score/order + one-tap summary digest action
- Add `#approval-delay-execution-backlog-digest` section in `/employee`
  - digest cards composed from approval delay execution backlog signals
  - digest score/order + one-tap backlog digest action
- Add `#mobile-follow-up-recommendation-upgrade-5` section
  - prioritized recommendations from summary digest, backlog digest, resubmit readiness, and API recovery
  - one-tap recommendation routing
- Add employee mobile shortcut buttons and sidebar anchors for new sections
- Add WI-0171 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Employee reviews execution summary digest and runs high-impact follow-up first.
2. Employee triages delay backlog digest and executes urgent backlog response in one tap.
3. Employee runs upgrade-5 recommendations that unify digest/resubmit/recovery signals.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove summary-digest/backlog-digest/recommendation-upgrade-5 sections.
- Remove added employee mobile shortcut buttons and sidebar anchors.
- Remove WI-0171 e2e wiring from package scripts.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Request history execution summary digest cards render and run one-tap actions.
- [x] Approval delay execution backlog digest cards render and run one-tap actions.
- [x] Recommendation upgrade 5 cards render and route one-tap actions.
- [x] Employee sidebar includes new WI-0171 anchors.
- [x] WI-0171 e2e is added and included in MVP/FULL suites.
