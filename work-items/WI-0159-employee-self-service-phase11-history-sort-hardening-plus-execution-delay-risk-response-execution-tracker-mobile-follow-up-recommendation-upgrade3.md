# WI-0159: Employee Self-Service UX Phase 11 - History Sort Hardening Plus Execution, Delay Risk Response Execution Tracker, Mobile Follow-up Recommendation Upgrade 3

## Background and Problem

`/employee` already provides request history sort hardening+, delay response execution guide, and recommendation upgrade 2 (WI-0155).

Employees still need tighter execution follow-through:

- hardening+ exists, but there is no execution-focused layer with readiness score and checklist
- delay response execution guide exists, but there is no tracker layer that prioritizes ongoing follow-up by urgency
- recommendation upgrade 2 exists, but it does not prioritize hardening+ execution and execution-tracker signals together

This WI adds phase-11 self-service UX support focused on hardening+ execution cards, delay-response execution tracking, and recommendation upgrade 3.

## Scope

### In Scope

- Add request history sort hardening plus execution section in `/employee`
  - execution cards derived from hardening+ signals
  - readiness score + execution checklist + one-tap execution
  - section anchor: `#request-history-sort-hardening-plus-execution`
- Add approval delay risk response execution tracker section
  - tracker cards derived from delay execution-guide signals
  - tracker score + tracker label + one-tap execution
  - section anchor: `#approval-delay-risk-response-execution-tracker`
- Add mobile follow-up recommendation upgrade 3 section
  - prioritized recommendations from hardening+ execution, execution tracker, resubmit flow, and API recovery
  - one-tap upgraded recommendation execution
  - section anchor: `#mobile-follow-up-recommendation-upgrade-3`
- Add employee sidebar anchors and mobile shortcut buttons for all new sections
- Add WI-0159 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Employee runs hardening+ execution cards with readiness scoring to stabilize request history ordering.
2. Employee tracks delay response with execution-tracker cards and handles urgent pending queues first.
3. Employee executes recommendation upgrade 3 to prioritize the highest-impact follow-up action from one panel.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove hardening-plus-execution, execution-tracker, and recommendation-upgrade-3 sections.
- Remove added employee sidebar anchors/mobile shortcuts and related styles.
- Remove WI-0159 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Hardening-plus-execution cards render readiness/checklist and run one-tap action.
- [x] Delay-response execution-tracker cards render tracker score/label and run one-tap action.
- [x] Recommendation-upgrade-3 cards render prioritized actions and execute one-tap routing.
- [x] Employee sidebar includes new WI-0159 anchors.
- [x] WI-0159 e2e is added and included in MVP/FULL suites.
