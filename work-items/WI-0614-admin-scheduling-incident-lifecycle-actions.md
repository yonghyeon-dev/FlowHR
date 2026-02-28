# WI-0614: Admin scheduling incident lifecycle actions

## Background

`/admin/scheduling` can list anomaly incidents (WI-0613), but admins still needed separate API tooling
to execute lifecycle actions (`ACKNOWLEDGE`, `ASSIGN`, `RESOLVE`).

## Scope

- Extend scheduling incident panel with incident selection and lifecycle action controls.
- Wire actions to existing APIs:
  - `POST /api/scheduling/anomalies/incidents/{incidentId}/ack`
  - `POST /api/scheduling/anomalies/incidents/{incidentId}/assign`
  - `POST /api/scheduling/anomalies/incidents/{incidentId}/resolve`
- Add i18n copy for action labels, pending labels, and status feedback.
- Preserve line-budget constraints by keeping lifecycle orchestration in incident hook/component.
- Add WI-0614 regression guard and roadmap entry.

## Out of Scope

- New anomaly incident API/schema changes
- Escalation/auto-action policy changes
- Scheduling service domain logic changes

## Acceptance Criteria

1. Admin can select an incident from the queue and run acknowledge/assign/resolve actions in the same panel.
2. Assign action requires assignee ID and shows validation feedback when missing.
3. Action success emits localized status message and refreshes current incident list.
4. Existing incident query and schedule CRUD behavior remain unchanged.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0614-admin-scheduling-incident-lifecycle-actions.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0613-admin-scheduling-incident-query-ux-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0397-scheduling-dedicated-admin-employee-workspace-baseline.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
