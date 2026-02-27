# WI-0613: Admin scheduling incident query UX summary

## Background

`/admin/scheduling` had schedule CRUD controls but no direct visibility for anomaly incidents.
Admins had to use separate APIs to inspect incident state distribution and assignee gaps.

## Scope

- Add incident query panel to `AdminSchedulingWorkspace`.
- Provide state/assignee/topN filters and quick filter actions.
- Show queue summary counts (total, state buckets, unassigned) and incident list rows.
- Keep `AdminSchedulingWorkspace.tsx` and `AdminSchedulingWorkspaceView.tsx` line budgets (`<=300`).
- Add WI-0613 regression guard and roadmap entry.

## Out of Scope

- Incident lifecycle mutation UX (ack/assign/resolve actions)
- SLA/escalation/auto-action workflow changes
- Scheduling API schema changes

## Acceptance Criteria

1. Admin scheduling workspace can query `/api/scheduling/anomalies/incidents` with state/assignee/topN filters.
2. Incident panel exposes quick filter actions for `ALL/ACKNOWLEDGED/ASSIGNED/RESOLVED`.
3. Incident summary and list render deterministic state/assignee/update/history visibility.
4. Existing schedule CRUD behavior remains unchanged.
5. Workspace/view line budgets remain under guard limits.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0613-admin-scheduling-incident-query-ux-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0397-scheduling-dedicated-admin-employee-workspace-baseline.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
