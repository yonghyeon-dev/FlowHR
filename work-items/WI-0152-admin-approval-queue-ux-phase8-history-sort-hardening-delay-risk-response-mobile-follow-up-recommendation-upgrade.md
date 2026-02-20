# WI-0152: Admin Approval Queue UX Phase 8 - History Sort Hardening, Delay Risk Response, Mobile Follow-up Recommendation Upgrade

## Background and Problem

`/admin` already provides history sort accuracy, delay risk prediction, and mobile follow-up recommendation (WI-0148).

Operators still need a stronger execution layer after risk detection:

- sort-accuracy insight exists, but there is no direct hardening preset to stabilize triage order immediately
- delay-risk prediction exists, but there is no response-focused panel with action window and one-tap mitigation
- mobile recommendation exists, but it does not prioritize upgraded follow-up actions from hardening and response signals

This WI adds phase-8 approval-queue support focused on sort hardening, response-driven delay mitigation, and upgraded mobile recommendation priority.

## Scope

### In Scope

- Add approval history sort hardening section in `/admin`
  - hardening cards derived from sort-accuracy signals
  - confidence gap + recommended search/sort preset + one-tap execution
  - section anchor: `#approval-history-sort-hardening`
- Add approval delay risk response section
  - response cards from delay-risk prediction with response window and mitigation guidance
  - one-tap search/sort preset execution
  - section anchor: `#approval-delay-risk-response`
- Add mobile follow-up recommendation upgrade section
  - prioritized recommendations from sort hardening, delay response, search execution, and selection integrity
  - one-tap upgraded recommendation execution
  - section anchor: `#approval-mobile-follow-up-recommendation-upgrade`
- Add admin sidebar anchors and quick-jump buttons for all new sections
- Add WI-0152 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Admin applies one-tap sort hardening preset when queue ordering confidence drops.
2. Admin responds to delay risk using response-window guidance and preset search/sort actions.
3. Admin executes upgraded mobile recommendations prioritized by operational urgency.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove sort-hardening, delay-risk response, and recommendation-upgrade sections.
- Remove added admin sidebar anchors/quick-jumps and related styles.
- Remove WI-0152 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Sort hardening cards render confidence gap/recommended preset and run one-tap action.
- [x] Delay risk response cards render response window/guidance and run one-tap mitigation action.
- [x] Mobile recommendation upgrade cards render prioritized actions and execute one-tap routing.
- [x] Admin sidebar includes new WI-0152 anchors.
- [x] WI-0152 e2e is added and included in MVP/FULL suites.
