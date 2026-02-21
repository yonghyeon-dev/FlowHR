> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0160: Admin Approval Queue UX Phase 10 - History Sort Hardening Plus Execution, Delay Risk Response Execution Tracker, Mobile Follow-up Recommendation Upgrade 3

## Background and Problem

`/admin` already provides phase-9 approval-queue UX from WI-0156:

- history sort hardening plus
- delay risk response execution guide
- mobile follow-up recommendation upgrade 2

Admins still need direct execution readiness and action tracking:

- hardening-plus signals exist, but execution-oriented readiness cards are missing
- delay response guide exists, but execution-tracker cards for active follow-up are missing
- recommendation upgrade 2 exists, but it does not prioritize the new execution cards/tracker layer

This WI adds phase-10 approval-queue UX support focused on hardening-plus execution cards, delay-response execution tracking, and recommendation upgrade 3 routing.

## Scope

### In Scope

- Add approval history sort hardening plus execution section in `/admin`
  - execution cards from hardening-plus signals with readiness score and execution checklist
  - one-tap execution preset action
  - section anchor: `#approval-history-sort-hardening-plus-execution`
- Add approval delay risk response execution tracker section
  - tracker cards from delay-response execution-guide signals
  - tracker score/label + response-window follow-up checklist
  - one-tap execution tracker action
  - section anchor: `#approval-delay-risk-response-execution-tracker`
- Add mobile follow-up recommendation upgrade 3 section
  - prioritized recommendations from hardening-plus execution, delay-response execution tracker, search execution, and selection integrity
  - one-tap recommendation routing
  - section anchor: `#approval-mobile-follow-up-recommendation-upgrade-3`
- Add admin sidebar anchors and search/sort quick-jump buttons for all new sections
- Add WI-0160 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Admin runs hardening-plus execution directly when sort readiness is low.
2. Admin tracks and executes delay-risk mitigation using execution-tracker guidance.
3. Admin runs third-stage mobile recommendations prioritized by execution urgency.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove hardening-plus execution, execution tracker, and recommendation-upgrade-3 sections.
- Remove added admin sidebar anchors/quick-jumps and related styles.
- Remove WI-0160 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Hardening-plus execution cards render readiness/checklist and run one-tap action.
- [x] Delay-response execution tracker cards render tracker metadata and run one-tap action.
- [x] Recommendation-upgrade-3 cards render prioritized actions and execute one-tap routing.
- [x] Admin sidebar includes new WI-0160 anchors.
- [x] WI-0160 e2e is added and included in MVP/FULL suites.
