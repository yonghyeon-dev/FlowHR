> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0172: Admin Approval Queue UX Phase 13 - Execution Summary Digest, Delay Backlog Digest, Mobile Follow-up Recommendation Upgrade 6

## Background and Problem

`/admin` already provides phase-12 approval queue UX from WI-0168:

- history execution summary cards
- delay execution backlog digest cards
- mobile follow-up recommendation upgrade 5

Admins still need a tighter digest-first execution layer:

- execution summary exists, but digest-level prioritization for immediate triage is not isolated
- delay backlog digest exists, but summary-digest and backlog-digest routing is not unified in one recommendation layer
- recommendation upgrade 5 exists, but it does not route through summary-digest/backlog-digest lenses

This WI adds phase-13 approval queue UX focused on summary digest triage and recommendation upgrade 6 routing.

## Scope

### In Scope

- Add `#approval-history-execution-summary-digest` section in `/admin`
  - digest cards composed from history execution summary signals
  - digest score/order + one-tap summary digest action
- Keep and reuse `#approval-delay-execution-backlog-digest` section as digest triage counterpart
- Add `#approval-mobile-follow-up-recommendation-upgrade-6` section in `/admin`
  - prioritized recommendations from summary digest, backlog digest, search coverage, and selection integrity
  - one-tap recommendation routing
- Add approval queue quick-jump buttons and admin sidebar anchors for new sections
- Add WI-0172 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Admin triages history execution summary digest and runs highest-impact follow-up first.
2. Admin uses backlog digest in the same execution lane and executes urgent responses in one tap.
3. Admin executes upgrade-6 recommendations that unify digest/search/selection signals.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove summary-digest/recommendation-upgrade-6 sections.
- Remove added quick-jump buttons and admin sidebar anchors.
- Remove WI-0172 e2e wiring from package scripts.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] History execution summary digest cards render and run one-tap actions.
- [x] Delay execution backlog digest cards remain integrated with upgrade-6 routing.
- [x] Recommendation upgrade 6 cards render and route one-tap actions.
- [x] Admin sidebar includes new WI-0172 anchors.
- [x] WI-0172 e2e is added and included in MVP/FULL suites.
