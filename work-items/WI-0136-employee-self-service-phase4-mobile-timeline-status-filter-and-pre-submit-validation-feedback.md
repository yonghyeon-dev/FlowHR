> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0136: Employee Self-Service UX Phase 4 - Mobile Timeline, Status Filter, Pre-submit Validation Feedback

## Background and Problem

`/employee` already has request feedback cards and mobile shortcuts, but employees still need:

- a mobile-friendly request timeline view
- status-based filtering when checking recent request outcomes
- clear pre-submit validation feedback before correction/leave submission

This WI extends the existing self-service screen around those actions without backend/API changes.

## Scope

### In Scope

- Add request status filter UI to feedback panel
  - `all / PENDING / APPROVED / REJECTED / CANCELED`
- Add mobile request history timeline panel
  - channel filter (`all / attendance / leave`)
  - status filter (`all / PENDING / APPROVED / REJECTED / CANCELED`)
  - latest timeline list (recent request events)
- Add pre-submit validation feedback blocks
  - attendance correction pre-submit checks
  - leave request pre-submit checks
  - disable leave submit when validation fails
- Add employee sidebar anchor for timeline section
- Add styles and mobile responsive rules for timeline/filter/validation blocks
- Add WI-0136 e2e and wire to MVP/FULL suites

### Out of Scope

- API endpoint or schema changes
- DB model/migration changes
- scheduler/cron/workflow automation

## User Scenarios

1. Employee filters request feedback by status to inspect only pending/rejected requests.
2. Employee checks recent request timeline on mobile and filters by channel/status quickly.
3. Employee sees pre-submit validation results before submitting correction/leave requests.

## Data and API Changes

- No DB schema changes
- No API contract changes
- Client-side UX/state validation enhancement only

## Rollback Plan

- Remove timeline/status-filter/validation UI blocks and revert to WI-0133 baseline.
- Revert sidebar anchor and style additions.
- Rollback is file-level UI/test/docs revert (no backend rollback needed).

## Definition of Done (DoD)

- [x] Feedback status filter renders and filters rows correctly.
- [x] Mobile request timeline panel renders with channel/status filters.
- [x] Attendance/leave pre-submit validation feedback lists render.
- [x] Leave submit is guarded when validation fails.
- [x] WI-0136 e2e is added and included in MVP/FULL suites.
