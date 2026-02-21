> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0164: Admin Approval Queue UX Phase 11 - History Sort Execution Tracker, Delay Risk Execution Backlog, Mobile Follow-up Recommendation Upgrade 4

## Background and Problem

`/admin` already provides phase-10 approval queue UX from WI-0160:

- history sort hardening plus execution cards
- delay risk response execution tracker cards
- mobile follow-up recommendation upgrade 3

Admins still need tighter execution prioritization:

- hardening-plus execution cards exist, but there is no tracker-level prioritization panel
- delay-response tracker exists, but backlog urgency across pending volume/response window is not isolated
- recommendation upgrade 3 exists, but it does not route directly through execution tracker/backlog lenses

This WI adds phase-11 approval queue UX focused on execution tracker consolidation, delay backlog prioritization, and recommendation upgrade 4 routing.

## Scope

### In Scope

- Add `#approval-history-sort-execution-tracker` section in `/admin`
  - tracker cards composed from hardening-plus execution signals
  - tracker score/order + one-tap execution action
- Add `#approval-delay-risk-execution-backlog` section in `/admin`
  - backlog cards composed from delay-response execution tracker signals
  - backlog score/order + one-tap backlog response action
- Add `#approval-mobile-follow-up-recommendation-upgrade-4` section in `/admin`
  - prioritized recommendations from execution tracker, delay backlog, search coverage, and selection integrity
  - one-tap recommendation routing
- Add approval queue quick-jump buttons and admin sidebar anchors for new sections
- Add WI-0164 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Admin opens execution tracker cards to process highest-impact sort execution actions first.
2. Admin reviews delay execution backlog by urgency and runs response actions without leaving the queue context.
3. Admin executes upgrade-4 mobile follow-up recommendations that unify tracker/backlog/search/selection signals.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove execution tracker/backlog/recommendation-upgrade-4 sections.
- Remove added quick-jump buttons and admin sidebar anchors.
- Remove WI-0164 e2e wiring from package scripts.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] History sort execution tracker cards render and run one-tap actions.
- [x] Delay risk execution backlog cards render and run one-tap actions.
- [x] Recommendation upgrade 4 cards render and route one-tap actions.
- [x] Admin sidebar includes new WI-0164 anchors.
- [x] WI-0164 e2e is added and included in MVP/FULL suites.
