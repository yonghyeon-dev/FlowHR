# WI-0800 Admin Analytics Focus Metric Deeplink

## Background

- `/admin/analytics` supports metric focus selection, but focus state is lost on refresh/share.
- Admin operators also need a direct route from selected focus metric to the relevant workspace.

## Scope

- Sync selected focus metric with `?focus=` query parameter in `/admin/analytics`.
- Restore focus metric from query on page load.
- Add focused-workspace panel with:
  - one-click open action to related workspace
  - focused-link copy action for shareable deep links
- Add localized copy keys and regression guard.

## Acceptance Criteria

1. Opening `/admin/analytics?focus=...` restores the selected focus metric.
2. Changing focus metric updates the URL query and keeps navigation shareable/bookmarkable.
3. Focused-workspace panel shows related workspace action and focused-link copy action.
4. Regression test and roadmap/work-item links are updated.

## Notes

- Product UX enhancement only.
- No API contract/schema change.
