# WI-0791 Employee Deeplink Focus Query Sweep

## Background

- WI-0789 and WI-0790 established `/employee?focus=...` as the canonical in-page deep-link pattern.
- A few employee-facing entry points still used legacy `/employee#...` anchors, causing inconsistent navigation behavior.

## Scope

- Update schedule quick-correction deep-link in `EmployeeScheduleBoardView`:
  - from `/employee?attendanceSource=...#attendance`
  - to `/employee?focus=attendance&attendanceSource=...`
- Reuse the same deep-link for conflict follow-up quick CTA.
- Update employee in-app guide quick-action links to focus-query routes for attendance/leave (ko + en copy).
- Update affected regression tests (`WI-0588`, `WI-0615`) and add WI-0791 guard.
- Update roadmap traceability entry.

## Acceptance Criteria

1. Employee schedule quick-correction CTA routes with `?focus=attendance` and preserves schedule range query.
2. Employee in-app guide quick actions for attendance/leave use focus-query routes in ko/en copy.
3. Legacy `/employee#attendance` deep-link usage is removed from these surfaces.
4. Regression tests and roadmap/work-item links are updated.

## Notes

- UX navigation consistency update only.
- No API/schema/permission changes.
