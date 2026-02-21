> **DEPRECATED**: ? WI? ???? ??? ??(WI-0176~0181)?? ???????.
> ??: docs/codex-guide.md Part 1
# WI-0137: Admin Approval Queue UX Phase 3 - Item History Summary, Bulk Pre-validation, Mobile Result Feedback

## Background and Problem

`/admin#approvals` already supports queue badges, filtering, sorting, and mobile quick actions.
However, admins still need three UX gaps to reduce mis-clicks during bulk handling:

- item-level action history context while scanning queue rows
- clear validation feedback before bulk approve/reject
- immediate mobile-focused result feedback after action execution

This WI adds those UX improvements without backend/API changes.

## Scope

### In Scope

- Add item-level history summary model from in-page approval activity data
  - per-item aggregate counters (`total / ok / fail / approve / reject / confirm`)
  - inline history hint in queue rows (attendance/leave/payroll)
  - dedicated item history summary section in approval panel
- Add bulk pre-validation feedback section
  - attendance checks: selection + filter sync + reject-reason recommendation
  - leave checks: selection + filter sync + required reject reason
  - disable bulk action buttons when required checks fail
- Add mobile approval result feedback section
  - latest action feedback (`queue / total / ok / fail / at`)
  - recent queue-by-queue result chips
  - `aria-live` region for immediate feedback updates
- Add admin sidebar anchors for new approval sub-sections
- Add WI-0137 e2e and wire it into MVP/FULL test suites

### Out of Scope

- Approval engine/state machine behavior changes
- API contract/schema changes
- DB migration/model changes
- scheduler/cron/workflow additions

## User Scenarios

1. Admin sees history signals per queue row before deciding approve/reject.
2. Admin gets explicit validation feedback before bulk processing selected items.
3. Admin on mobile immediately confirms action outcomes from compact feedback cards/chips.

## Data and API Changes

- No DB schema changes
- No API contract changes
- UI-only state/computed-model enhancements in admin page

## Rollback Plan

- Remove WI-0137 sections (`approval-bulk-validation`, `approval-item-history`, `approval-mobile-feedback`).
- Revert bulk button guards to pre-WI-0137 conditions.
- Revert inline history/feedback styles and sidebar anchor additions.
- Rollback scope is UI/tests/docs only (no backend rollback needed).

## Definition of Done (DoD)

- [x] Approval queue renders item-level history summary section and inline row hints.
- [x] Bulk pre-validation section renders checks and gates bulk actions.
- [x] Mobile result feedback section renders latest feedback and recent queue chips.
- [x] Admin sidebar includes anchors for WI-0137 approval sub-sections.
- [x] WI-0137 e2e is added and included in MVP/FULL suites.
