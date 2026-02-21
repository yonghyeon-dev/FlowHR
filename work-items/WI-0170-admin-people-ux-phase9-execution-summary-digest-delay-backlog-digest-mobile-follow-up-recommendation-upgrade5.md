> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0170: Admin People UX Phase 9 - Execution Summary Digest, Delay Backlog Digest, Mobile Follow-up Recommendation Upgrade 5

## Background and Problem

`/admin/people` already provides phase-8 UX from WI-0166:

- history sort execution summary cards
- history delay risk execution backlog cards
- mobile follow-up recommendation upgrade 4

Admins still need tighter digest-first prioritization in people history follow-up:

- execution summary exists, but digest-layer prioritization for rapid triage is not isolated
- execution backlog exists, but digest scoring for urgent delay response is not isolated
- recommendation upgrade 4 exists, but it does not route through summary/backlog digest lenses

This WI adds phase-9 people UX focused on digest triage and recommendation upgrade 5 routing.

## Scope

### In Scope

- Add `#history-execution-summary-digest` section in `/admin/people`
  - digest cards composed from history execution summary signals
  - digest score/order + one-tap summary digest action
- Add `#history-delay-execution-backlog-digest` section in `/admin/people`
  - digest cards composed from history delay execution backlog signals
  - digest score/order + one-tap backlog digest action
- Add `#people-mobile-follow-up-recommendation-upgrade-5` section
  - prioritized recommendations from summary digest, backlog digest, search execution, and selected employee readiness
  - one-tap recommendation routing
- Add people mobile quick-jump buttons and admin sidebar anchors for new sections
- Add WI-0170 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Admin reviews history execution summary digest and runs high-impact updates first.
2. Admin triages delay backlog digest and executes urgent response actions in one tap.
3. Admin uses upgrade-5 recommendations that unify digest/search/selection signals.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove summary-digest/backlog-digest/recommendation-upgrade-5 sections.
- Remove added quick-jump buttons and admin sidebar anchors.
- Remove WI-0170 e2e wiring from package scripts.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] History execution summary digest cards render and run one-tap actions.
- [x] History delay execution backlog digest cards render and run one-tap actions.
- [x] Recommendation upgrade 5 cards render and route one-tap actions.
- [x] Admin sidebar includes new WI-0170 anchors.
- [x] WI-0170 e2e is added and included in MVP/FULL suites.
