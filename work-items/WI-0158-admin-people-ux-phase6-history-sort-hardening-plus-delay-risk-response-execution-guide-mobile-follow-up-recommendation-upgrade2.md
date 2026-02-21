# WI-0158: Admin People UX Phase 6 - History Sort Hardening Plus, Delay Risk Response Execution Guide, Mobile Follow-up Recommendation Upgrade 2

## Background and Problem

`/admin/people` already provides history sort hardening, delay risk response, and mobile follow-up recommendation upgrade (WI-0154).

Admins still need stronger execution clarity:

- sort hardening exists, but there is no hardening-plus layer with stabilization score and execution status
- delay risk response exists, but there is no execution-guide panel that translates response windows into concrete checklist actions
- recommendation upgrade exists, but it does not prioritize the phase-6 hardening-plus and execution-guide signals

This WI adds phase-6 admin people UX support focused on hardening-plus execution confidence, delay-response execution guidance, and second-stage recommendation upgrades.

## Scope

### In Scope

- Add history sort hardening plus section in `/admin/people`
  - hardening-plus cards from sort-hardening signals
  - stabilization score + execution guidance + one-tap execution
  - section anchor: `#history-sort-hardening-plus`
- Add history delay risk response execution guide section
  - execution-guide cards from delay-risk response signals with execution checklist and response window
  - one-tap preset execution
  - section anchor: `#history-delay-risk-response-execution-guide`
- Add people mobile follow-up recommendation upgrade 2 section
  - prioritized recommendations from hardening+, delay execution guide, search execution, and selected employee readiness
  - one-tap upgraded recommendation execution
  - section anchor: `#people-mobile-follow-up-recommendation-upgrade-2`
- Add admin sidebar anchors and mobile quick-jump buttons for all new sections
- Add WI-0158 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Admin applies hardening-plus preset when people history sorting needs stabilization.
2. Admin executes delay-risk mitigation via execution-guide checklist and response window.
3. Admin runs second-stage mobile recommendations prioritized by execution urgency.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove hardening-plus, execution-guide, and recommendation-upgrade-2 sections.
- Remove added admin sidebar anchors/mobile quick-jumps and related styles.
- Remove WI-0158 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Hardening-plus cards render stabilization score/execution guidance and run one-tap action.
- [x] Delay-response execution-guide cards render checklist/window and run one-tap preset action.
- [x] Recommendation-upgrade-2 cards render prioritized actions and execute one-tap routing.
- [x] Admin sidebar includes new WI-0158 anchors.
- [x] WI-0158 e2e is added and included in MVP/FULL suites.
