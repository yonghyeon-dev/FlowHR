# WI-0119: Approval Execution Admin Visibility UI

## Background and Problem

WI-0118 added staged execution persistence and API, but operators still needed API calls to inspect progress. Admin users need a direct UI to see execution progress and stage-level logs per target entity.

## Scope

### In Scope

- Add `/admin/approval-executions` page.
- Provide execution list filters (organization/domain/state/target/limit).
- Show progress per execution (completed stages vs total stages, percent, state).
- Allow row selection and show linked stage-history details for the selected target.
- Add navigation links from Admin sidebar and approval history page.

### Out of Scope

- New backend contract/schema changes.
- Action command UI (approve/reject/confirm execution from this page).
- Notification/escalation workflow.

## User Scenarios

1. Admin filters `PENDING` execution rows and sees which targets are stuck at stage 1/2.
2. Admin clicks a target row and immediately sees stage-level allow/deny logs.
3. Admin moves between execution list and stage-history page from the same workflow.

## Authorization and Role Matrix

| Action | Admin | Manager | Payroll Operator | Employee | System |
| --- | --- | --- | --- | --- | --- |
| View approval execution dashboard | Allow | Allow (permission-based) | Allow (permission-based) | Deny | Allow |

## Data/API Changes

- No new DB changes.
- Reuse:
  - `GET /approval/executions`
  - `GET /approval/stage-history`

## Test Plan

- Manual:
  - Verify execution list loads with filters.
  - Verify selecting an execution loads matching stage-history rows.
  - Verify state/progress rendering for `PENDING/APPROVED/REJECTED`.
- Regression:
  - Existing approval history page navigation still works.
  - Admin layout navigation remains intact on desktop/mobile.

## Rollback Plan

- Remove `/admin/approval-executions` route and links.
- Keep backend execution API unchanged.

## Definition of Done (DoD)

- [x] Admin execution visibility page implemented.
- [x] Stage-history drill-down from selected execution implemented.
- [x] Admin navigation links updated.
- [x] Lint/typecheck/test baseline passed.
