# WI-0806 Admin Notices Status Action Visibility

## Background

- `/admin/notices` list previously hid edit/publish/delete actions for published rows.
- Operators could not quickly compare which actions are available by notice status.

## Scope

- Improve notice row action visibility by showing action controls consistently.
- Lock mutation actions for published notices with explicit disabled state and lock reason.
- Add status-based visibility summary counters (draft/scheduled/published) in the filter panel.

## Acceptance Criteria

1. Notice action buttons are visible in list rows regardless of status.
2. Published rows show action buttons as disabled with lock reason.
3. Filter panel displays status-based visible counts for draft/scheduled/published.
4. Regression test and roadmap/work-item links are updated.

## Notes

- Admin notices UX enhancement only.
- No API contract/schema changes.
