# WI-1162: 직원 홈 가이드 시각 밀도 정리

Reduce employee home density and restore clearer action hierarchy after the route-first guide cleanup.

## Background

- `WI-1161` normalized `/employee/guide` into the route-first workspace family.
- The employee home still presents quick actions, workspace hubs, and checklist priority actions with a dense flat rhythm.
- The home surface also still mixes an employee-only lane with an admin approval shortcut, which does not fit the intended role boundary.

## Scope

1. Rebuild the employee quick-task panel into a role-safe employee-only launcher.
2. Change employee workspace hubs from flat link stacks into `primary action + secondary links`.
3. Reduce priority-action density by surfacing only the top active items and keeping the detailed checklist below.
4. Add a regression guard and wire it into `test:integration`.
5. Update `docs/production-operating-progress.md` with the closed `WI-1161` state and the `WI-1162` start marker.

## Non-Goals

- Reworking employee route semantics or dashboard data sources
- Changing employee guide API or requests workflow logic
- Introducing a full design-system replacement beyond the employee home lane

## Acceptance Criteria

1. The employee quick-task panel exposes only employee-facing actions and no longer links to `/admin/approval-executions`.
2. Employee workspace hub cards render with an explicit primary action and grouped secondary actions.
3. The employee priority panel previews the top active items without rendering the full badge list as a flat action wall.
4. `npm run typecheck`, `npm test`, and `npm run test:integration` stay green.
