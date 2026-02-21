# WI-0168: Admin Approval Queue UX Phase 12 - Execution Summary, Delay Backlog Digest, Mobile Follow-up Recommendation Upgrade 5

## Background and Problem

`/admin` already provides phase-11 approval queue UX from WI-0164:

- history sort execution tracker cards
- delay risk execution backlog cards
- mobile follow-up recommendation upgrade 4

Admins still need one more execution-focused layer:

- execution tracker cards exist, but there is no summary layer for fast prioritization
- delay execution backlog exists, but digest-level triage for urgent actions is not isolated
- recommendation upgrade 4 exists, but it does not route through summary/digest lenses

This WI adds phase-12 approval queue UX focused on execution summary, backlog digest triage, and recommendation upgrade 5 routing.

## Scope

### In Scope

- Add `#approval-history-execution-summary` section in `/admin`
  - summary cards composed from execution tracker signals
  - summary score/order + one-tap execution summary action
- Add `#approval-delay-execution-backlog-digest` section in `/admin`
  - digest cards composed from delay execution backlog signals
  - digest score/order + one-tap backlog digest action
- Add `#approval-mobile-follow-up-recommendation-upgrade-5` section in `/admin`
  - prioritized recommendations from execution summary, backlog digest, search coverage, and selection integrity
  - one-tap recommendation routing
- Add approval queue quick-jump buttons and admin sidebar anchors for new sections
- Add WI-0168 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Admin opens history execution summary and runs highest-impact actions first.
2. Admin triages delay execution backlog digest and executes urgent responses in one tap.
3. Admin executes upgrade-5 mobile recommendations that unify summary/digest/search/selection signals.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove execution summary/backlog digest/recommendation-upgrade-5 sections.
- Remove added quick-jump buttons and admin sidebar anchors.
- Remove WI-0168 e2e wiring from package scripts.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] History execution summary cards render and run one-tap actions.
- [x] Delay execution backlog digest cards render and run one-tap actions.
- [x] Recommendation upgrade 5 cards render and route one-tap actions.
- [x] Admin sidebar includes new WI-0168 anchors.
- [x] WI-0168 e2e is added and included in MVP/FULL suites.
