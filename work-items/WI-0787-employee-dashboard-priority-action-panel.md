# WI-0787 Employee Dashboard Priority Action Panel

## Background

- `/employee` already provides checklist and summary cards, but users still need to scan multiple sections to find the next action.
- A single priority card is needed to guide immediate execution from dashboard top area.

## Scope

- Add `priority-action` panel to `EmployeeAccountOverviewPanels`.
- Derive priority item from `integratedSubmitChecklistCards`:
  - first blocked item (`ready === false`) has highest priority
  - fallback to first checklist item when all are ready
- Add CTA button that jumps to the target section via `onJumpToSection`.
- Add WI-0787 regression test.

## Acceptance Criteria

1. Employee dashboard renders localized priority-action panel.
2. Priority item selection follows blocked-first rule.
3. CTA routes user to target section from selected checklist card.
4. Work-item and roadmap traceability are updated.

## Notes

- UI-only enhancement for employee self-service flow acceleration.
- No backend/API/schema changes.
