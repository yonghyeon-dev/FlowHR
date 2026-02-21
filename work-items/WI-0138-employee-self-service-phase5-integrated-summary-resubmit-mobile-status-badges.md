> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0138: Employee Self-Service UX Phase 5 - Integrated Summary, Resubmit Flow, Mobile Status Badges

## Background and Problem

`/employee` already has feedback cards, timeline filters, and pre-submit checks.  
Employees still need faster triage in three points:

- one integrated view across attendance/leave request health
- a direct edit/resubmit flow for rejected/canceled requests
- mobile-friendly status badges to prioritize actions quickly

This WI adds those UX capabilities without backend/API changes.

## Scope

### In Scope

- Add integrated summary cards in employee portal
  - pending requests
  - completion rate
  - resubmit-needed count
  - API failure signal
- Add request edit/resubmit flow section
  - rejected/canceled candidate list (attendance + leave)
  - candidate selector + apply draft actions
  - flow checks before resubmit
  - applied-draft marker per candidate
- Add mobile status badge section
  - pending/resubmit/approved/API-fail badges
  - quick jump actions to feedback/resubmit sections
- Add employee sidebar anchors for new sections
  - `#self-service-overview`
  - `#request-resubmit`
  - `#mobile-status-badges`
- Add WI-0138 e2e and wire to MVP/FULL suites

### Out of Scope

- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions

## User Scenarios

1. Employee scans integrated cards to understand pending/failed/resubmit-required state at a glance.
2. Employee picks a rejected/canceled item, auto-fills a draft, and resubmits with fewer manual steps.
3. Employee on mobile uses status badges and quick actions to jump directly to the required section.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side state/computed/UI enhancement only

## Rollback Plan

- Remove integrated summary, resubmit flow, and mobile badge sections.
- Remove new sidebar anchors and related styles.
- Revert WI-0138 e2e wiring.
- Rollback scope is UI/tests/docs only.

## Definition of Done (DoD)

- [x] Integrated summary cards render and compute attendance/leave/request health signals.
- [x] Resubmit flow supports candidate selection and draft apply with flow checks.
- [x] Mobile status badges render and quick actions navigate to relevant sections.
- [x] Employee sidebar includes new section anchors.
- [x] WI-0138 e2e is added and included in MVP/FULL suites.
