# WI-0155: Employee Self-Service UX Phase 10 - History Sort Hardening Plus, Delay Risk Response Execution Guide, Mobile Follow-up Recommendation Upgrade 2

## Background and Problem

`/employee` already provides history sort hardening, delay risk response, and mobile follow-up recommendation upgrade (WI-0151).

Employees still need tighter execution guidance:

- sort hardening exists, but there is no stabilized hardening layer that shows execution readiness
- delay response exists, but there is no execution-guide panel that translates response windows into runnable checkpoints
- recommendation upgrade exists, but it does not prioritize the phase-10 hardening+ and execution-guide actions

This WI adds phase-10 self-service UX support focused on hardening-plus execution confidence, delay-response execution guidance, and second-stage recommendation upgrades.

## Scope

### In Scope

- Add request history sort hardening plus section in `/employee`
  - hardening-plus cards from sort-hardening signals
  - stabilization score + execution guidance + one-tap execution
  - section anchor: `#request-history-sort-hardening-plus`
- Add approval delay risk response execution guide section
  - execution-guide cards from delay-risk response signals with execution checklist and response window
  - one-tap preset execution
  - section anchor: `#approval-delay-risk-response-execution-guide`
- Add mobile follow-up recommendation upgrade 2 section
  - prioritized recommendations from hardening+, delay execution guide, resubmit readiness, and API recovery
  - one-tap upgraded recommendation execution
  - section anchor: `#mobile-follow-up-recommendation-upgrade-2`
- Add employee sidebar anchors and mobile shortcut buttons for all new sections
- Add WI-0155 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Employee applies hardening-plus preset when request history ordering needs stabilization.
2. Employee executes delay-risk mitigation using channel-specific execution guide checkpoints.
3. Employee runs second-stage mobile recommendations prioritized by execution urgency.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove hardening-plus, execution-guide, and recommendation-upgrade-2 sections.
- Remove added employee sidebar anchors/mobile shortcuts and related styles.
- Remove WI-0155 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Hardening-plus cards render stabilization score/execution guidance and run one-tap action.
- [x] Delay-response execution-guide cards render checklist/window and run one-tap preset action.
- [x] Recommendation-upgrade-2 cards render prioritized actions and execute one-tap routing.
- [x] Employee sidebar includes new WI-0155 anchors.
- [x] WI-0155 e2e is added and included in MVP/FULL suites.
