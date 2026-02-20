# WI-0154: Admin People UX Phase 5 - History Sort Hardening, Delay Risk Response, Mobile Follow-up Recommendation Upgrade

## Background and Problem

`/admin/people` already provides history sort accuracy, delay risk prediction, and mobile follow-up recommendation (WI-0150).

Admins still need stronger execution support after risk detection:

- sort-accuracy insights exist, but there is no hardening preset to stabilize history ordering
- delay-risk prediction exists, but there is no response panel with response window and one-tap mitigation
- mobile recommendation exists, but it does not prioritize upgraded follow-up actions from hardening and response signals

This WI adds phase-5 admin people UX support focused on sort hardening, response-driven delay mitigation, and upgraded mobile recommendations.

## Scope

### In Scope

- Add history sort hardening section in `/admin/people`
  - hardening cards derived from sort-accuracy signals
  - confidence gap + recommended search/sort preset + one-tap execution
  - section anchor: `#history-sort-hardening`
- Add history delay risk response section
  - response cards from delay-risk prediction with response window and mitigation guidance
  - one-tap search/sort preset execution
  - section anchor: `#history-delay-risk-response`
- Add people mobile follow-up recommendation upgrade section
  - prioritized recommendations from sort hardening, delay response, search execution, and selected employee readiness
  - one-tap upgraded recommendation execution
  - section anchor: `#people-mobile-follow-up-recommendation-upgrade`
- Add admin sidebar anchors and mobile quick-jump buttons for all new sections
- Add WI-0154 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Admin applies one-tap sort hardening preset when people history ordering confidence drops.
2. Admin responds to history delay risk with response-window guidance and preset search/sort actions.
3. Admin executes upgraded mobile recommendations prioritized by history follow-up urgency.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove sort-hardening, delay-risk response, and recommendation-upgrade sections.
- Remove added admin sidebar anchors/mobile quick-jumps and related styles.
- Remove WI-0154 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Sort hardening cards render confidence gap/recommended preset and run one-tap action.
- [x] Delay risk response cards render response window/guidance and run one-tap mitigation action.
- [x] Mobile recommendation upgrade cards render prioritized actions and execute one-tap routing.
- [x] Admin sidebar includes new WI-0154 anchors.
- [x] WI-0154 e2e is added and included in MVP/FULL suites.
