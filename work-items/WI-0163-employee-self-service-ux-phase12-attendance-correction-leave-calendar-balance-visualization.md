# WI-0163: Employee Self-Service UX Phase 12 - Attendance Correction Insights, Leave Balance Forecast, and Leave Calendar Insights

## Background and Problem

`/employee` already provides phase-11 UX from WI-0159:

- history sort hardening plus execution cards
- approval delay response execution tracker cards
- mobile follow-up recommendation upgrade 3

Employees still need clearer decision support on core self-service flows:

- attendance correction risk/impact cues before submit are fragmented
- leave balance trend/forecast is visible in pieces but not action-focused
- leave calendar hotspot and approval-rate interpretation is not explicit

This WI adds phase-12 self-service insights focused on correction readiness, leave forecast, and calendar hotspot interpretation.

## Scope

### In Scope

- Add `#attendance-correction-insights` section in `/employee`
  - target sync, validation progress, and correction impact cards
  - one-tap jump back to correction form
- Add `#leave-balance-forecast` section in `/employee`
  - leave pace forecast, request buffer, carry-over ratio cards
  - one-tap routing to leave form/calendar
- Add `#leave-calendar-insights` section in `/employee`
  - pending hotspot, density hotspot, approval-rate cards
  - one-tap routing to calendar/request feedback
- Add employee sidebar anchors and mobile shortcuts for all new sections
- Add WI-0163 e2e and include it in MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions
- webhook/email/ops channel expansion

## User Scenarios

1. Employee checks correction alignment and impact before submitting attendance correction.
2. Employee verifies leave consumption pace and remaining buffer before creating leave requests.
3. Employee reviews monthly calendar hotspots and approval rate to choose proper follow-up action.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove attendance correction insights, leave balance forecast, leave calendar insights sections.
- Remove added employee sidebar anchors/mobile shortcut buttons.
- Remove WI-0163 e2e wiring from package scripts.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Attendance correction insights cards render and route correctly.
- [x] Leave balance forecast cards render and route correctly.
- [x] Leave calendar insights cards render and route correctly.
- [x] Employee sidebar includes new WI-0163 anchors.
- [x] WI-0163 e2e is added and included in MVP/FULL suites.
