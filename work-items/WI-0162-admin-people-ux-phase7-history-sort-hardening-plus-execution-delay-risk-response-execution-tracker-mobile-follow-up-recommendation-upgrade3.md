> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0162: Admin People UX Phase 7 - History Sort Hardening Plus Execution, Delay Risk Response Execution Tracker, Mobile Follow-up Recommendation Upgrade 3

## Background and Problem

`/admin/people` already provides phase-6 UX from WI-0158:

- history sort hardening plus
- delay risk response execution guide
- mobile follow-up recommendation upgrade 2

Admins still need execution-first follow-up control:

- hardening-plus signals exist, but execution readiness cards are missing
- delay-response execution guide exists, but execution tracker cards for active follow-up are missing
- recommendation upgrade 2 exists, but it does not prioritize execution cards/tracker signals

This WI adds phase-7 admin people UX support focused on hardening-plus execution cards, delay-response execution tracking, and recommendation upgrade 3 routing.

## Scope

### In Scope

- Add history sort hardening plus execution section in `/admin/people`
  - execution cards from hardening-plus signals with readiness score and execution checklist
  - one-tap execution preset action
  - section anchor: `#history-sort-hardening-plus-execution`
- Add history delay risk response execution tracker section
  - tracker cards from delay-response execution-guide signals
  - tracker score/label + response-window follow-up checklist
  - one-tap execution tracker action
  - section anchor: `#history-delay-risk-response-execution-tracker`
- Add people mobile follow-up recommendation upgrade 3 section
  - prioritized recommendations from hardening-plus execution, delay-response execution tracker, search execution, and selected employee readiness
  - one-tap recommendation routing
  - section anchor: `#people-mobile-follow-up-recommendation-upgrade-3`
- Add admin sidebar anchors and mobile quick-jump buttons for all new sections
- Add WI-0162 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Admin runs hardening-plus execution directly when people history sort readiness is low.
2. Admin tracks and executes delay-risk mitigation via execution-tracker cards.
3. Admin runs third-stage mobile recommendations prioritized by execution urgency.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove hardening-plus execution, execution tracker, and recommendation-upgrade-3 sections.
- Remove added admin sidebar anchors/quick-jumps and related styles.
- Remove WI-0162 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Hardening-plus execution cards render readiness/checklist and run one-tap action.
- [x] Delay-response execution tracker cards render tracker metadata and run one-tap action.
- [x] Recommendation-upgrade-3 cards render prioritized actions and execute one-tap routing.
- [x] Admin sidebar includes new WI-0162 anchors.
- [x] WI-0162 e2e is added and included in MVP/FULL suites.
