# WI-0794 Employee Account Overview Korean Copy Repair

## Background

- `/employee` account overview panel still contained corrupted Korean runtime strings (mojibake).
- This made core employee journey copy unreadable in Korean locale and reduced product readiness.

## Scope

- Repair Korean copy literals in `src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx`.
- Keep existing behavior, routes, and devtools gating unchanged.
- Add WI-0794 regression guard and roadmap traceability update.

## Acceptance Criteria

1. Korean locale labels in employee account overview render readable product copy.
2. Previously corrupted mojibake fragments are removed from the component source.
3. Regression test and roadmap/work-item links are updated.

## Notes

- UX copy normalization only.
- No API/schema/auth contract changes.
