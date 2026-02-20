# WI-0134: Payslip UX Phase 2 - Status Feedback, Compare View, and Mobile Delivery Flow

## Background and Problem

`/employee/payslips` already supports list/detail/print, but users still lack three UX pieces in the core journey:

- clear status feedback when API calls fail
- fast side-by-side comparison between selected payslip and a previous period
- mobile-first delivery flow guidance after verification

This WI upgrades the payslip experience around those three user actions without adding new backend contracts.

## Scope

### In Scope

- Add payslip status feedback panel in `/employee/payslips`
  - latest API call status
  - latest failure cause visualization and copy action
  - recovery guidance message
- Add payslip compare view panel
  - select comparison target from loaded payslips
  - gross/deduction/net delta cards
  - comparison table and snapshot copy action
- Add mobile delivery flow panel
  - channel selector (kakao/email/sms)
  - step-by-step state flow (prepare -> simulate send)
  - inline delivery feedback state
- Add employee sidebar anchors to each new payslip section
- Add styles and mobile responsive rules
- Add WI-0134 e2e coverage and include it in e2e suites

### Out of Scope

- New payroll API endpoints
- New DB models or migrations
- New scheduler/cron/workflow automation

## User Scenarios

1. Employee checks the latest API result and immediately sees the failure reason.
2. Employee compares current payslip with previous period and confirms delta before delivery.
3. Employee follows mobile delivery steps and completes a delivery simulation flow with clear feedback.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-only UX and state management enhancements

## Rollback Plan

- Remove three new payslip panels and restore prior single-detail experience.
- Revert employee sidebar payslip anchors.
- Revert only UI and e2e files (no backend rollback needed).

## Definition of Done (DoD)

- [x] Status feedback panel renders latest status and failure cause copy action.
- [x] Compare view supports delta cards and comparison table for selected vs target run.
- [x] Mobile delivery flow supports channel selection, step state, and simulation feedback.
- [x] Employee sidebar includes anchors to new payslip sections.
- [x] WI-0134 e2e test is added and wired to MVP/FULL suites.
