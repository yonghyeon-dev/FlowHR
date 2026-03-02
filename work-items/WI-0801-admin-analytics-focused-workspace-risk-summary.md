# WI-0801 Admin Analytics Focused Workspace Risk Summary

## Background

- WI-0800 added `?focus` deeplinks and focused workspace quick navigation.
- Admin still needs a compact summary of the selected KPI before moving to the workspace.

## Scope

- Extend focused workspace panel in `/admin/analytics` with selected KPI summary:
  - metric label
  - current period value
  - previous period value
  - delta
  - trend direction (up/down/flat)
- Show fallback guidance when focus metric is `all`.
- Add localized copy keys and regression guard.

## Acceptance Criteria

1. Focused workspace panel displays selected KPI summary when `focus` is set.
2. Summary uses current/previous/delta values from analytics trend data.
3. Fallback guidance is shown when no single focus KPI is selected.
4. Regression test and roadmap/work-item links are updated.

## Notes

- Product analytics UX enhancement only.
- No API contract/schema change.
