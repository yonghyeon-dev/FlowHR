# WI-0788 Employee Priority Action Next Route

## Background

- WI-0787 added a priority-action panel to `/employee`, but CTA was limited to in-page section jump.
- Users still need a direct route action to open the related workspace context quickly.

## Scope

- Add `resolvePriorityWorkspaceTarget` mapping in `EmployeeAccountOverviewPanels`:
  - `attendance` -> `/employee#attendance`
  - `leave` -> `/employee#leave`
  - `request-resubmit` -> `/employee#request-resubmit`
  - fallback -> `/employee#{sectionId}`
- Render a secondary link CTA in the priority-action panel using mapped route and localized label.
- Add WI-0788 regression test and roadmap traceability update.

## Acceptance Criteria

1. Priority-action panel derives related workspace route from checklist target section.
2. Priority-action panel renders both:
   - primary button for section jump
   - secondary link for related workspace route
3. Attendance/leave/resubmit target mappings are explicitly covered.
4. Work-item and roadmap entries are updated.

## Notes

- UI-only flow acceleration change.
- No API/schema/permission modifications.
