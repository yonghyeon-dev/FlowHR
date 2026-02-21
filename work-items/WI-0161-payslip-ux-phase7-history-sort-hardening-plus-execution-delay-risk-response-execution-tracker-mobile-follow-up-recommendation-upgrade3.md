# WI-0161: Payslip UX Phase 7 - History Sort Hardening Plus Execution, Delay Risk Response Execution Tracker, Mobile Follow-up Recommendation Upgrade 3

## Background and Problem

`/employee/payslips` already provides phase-6 UX from WI-0157:

- history sort hardening plus
- delay risk response execution guide
- mobile follow-up recommendation upgrade 2

Employees still need direct execution readiness and tracking:

- hardening-plus signals exist, but execution-oriented readiness cards are missing
- delay response execution guide exists, but execution-tracker cards for active follow-up are missing
- recommendation upgrade 2 exists, but it does not prioritize execution cards/tracker signals

This WI adds phase-7 payslip UX support focused on hardening-plus execution cards, delay-response execution tracking, and recommendation upgrade 3 routing.

## Scope

### In Scope

- Add payslip history sort hardening plus execution section in `/employee/payslips`
  - execution cards from hardening-plus signals with readiness score and execution checklist
  - one-tap execution preset action
  - section anchor: `#payslip-history-sort-hardening-plus-execution`
- Add payslip delay risk response execution tracker section
  - tracker cards from delay-response execution-guide signals
  - tracker score/label + response-window follow-up checklist
  - one-tap execution tracker action
  - section anchor: `#payslip-delay-risk-response-execution-tracker`
- Add payslip mobile follow-up recommendation upgrade 3 section
  - prioritized recommendations from hardening-plus execution, delay-response execution tracker, search execution, and delivery handoff recovery
  - one-tap recommendation routing
  - section anchor: `#payslip-mobile-follow-up-recommendation-upgrade-3`
- Add employee sidebar anchors and search/sort quick-jump buttons for all new sections
- Add WI-0161 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Employee runs hardening-plus execution directly when payslip sort readiness is low.
2. Employee tracks and executes payout delay mitigation via execution-tracker cards.
3. Employee runs third-stage mobile recommendations prioritized by payout handoff urgency.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove hardening-plus execution, execution tracker, and recommendation-upgrade-3 sections.
- Remove added employee sidebar anchors/quick-jumps and related styles.
- Remove WI-0161 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Hardening-plus execution cards render readiness/checklist and run one-tap action.
- [x] Delay-response execution tracker cards render tracker metadata and run one-tap action.
- [x] Recommendation-upgrade-3 cards render prioritized actions and execute one-tap routing.
- [x] Employee sidebar includes new WI-0161 anchors.
- [x] WI-0161 e2e is added and included in MVP/FULL suites.
