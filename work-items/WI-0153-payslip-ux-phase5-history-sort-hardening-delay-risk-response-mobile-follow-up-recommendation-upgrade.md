# WI-0153: Payslip UX Phase 5 - History Sort Hardening, Delay Risk Response, Mobile Follow-up Recommendation Upgrade

## Background and Problem

`/employee/payslips` already provides history sort accuracy, delay risk prediction, and mobile follow-up recommendation (WI-0149).

Employees still need a stronger execution layer after risk detection:

- sort-accuracy insight exists, but there is no direct hardening preset to stabilize payout follow-up order
- delay-risk prediction exists, but there is no response-focused panel with action window and one-tap mitigation
- mobile recommendation exists, but it does not prioritize upgraded follow-up actions from hardening and response signals

This WI adds phase-5 payslip UX support focused on sort hardening, response-driven delay mitigation, and upgraded mobile recommendation priority.

## Scope

### In Scope

- Add payslip history sort hardening section in `/employee/payslips`
  - hardening cards derived from sort-accuracy signals
  - confidence gap + recommended search/sort preset + one-tap execution
  - section anchor: `#payslip-history-sort-hardening`
- Add payslip delay risk response section
  - response cards from delay-risk prediction with response window and mitigation guidance
  - one-tap search/sort preset execution
  - section anchor: `#payslip-delay-risk-response`
- Add payslip mobile follow-up recommendation upgrade section
  - prioritized recommendations from sort hardening, delay response, search execution, and delivery handoff readiness
  - one-tap upgraded recommendation execution
  - section anchor: `#payslip-mobile-follow-up-recommendation-upgrade`
- Add employee sidebar anchors and quick-jump buttons for all new sections
- Add WI-0153 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Employee applies one-tap sort hardening preset when payslip history ordering confidence drops.
2. Employee responds to payout delay risk using response-window guidance and preset search/sort actions.
3. Employee executes upgraded mobile recommendations prioritized by payout handoff urgency.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove sort-hardening, delay-risk response, and recommendation-upgrade sections.
- Remove added employee sidebar anchors/quick-jumps and related styles.
- Remove WI-0153 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Sort hardening cards render confidence gap/recommended preset and run one-tap action.
- [x] Delay risk response cards render response window/guidance and run one-tap mitigation action.
- [x] Mobile recommendation upgrade cards render prioritized actions and execute one-tap routing.
- [x] Employee sidebar includes new WI-0153 anchors.
- [x] WI-0153 e2e is added and included in MVP/FULL suites.
