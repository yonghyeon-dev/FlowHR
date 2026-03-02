# WI-0803 Admin Analytics CSV Focus Workspace Context

## Background

- WI-0800 introduced focus metric deeplinks in `/admin/analytics`.
- WI-0802 added KPI card-level workspace quick jumps.
- CSV exports still only include `focusMetric`, so users cannot reopen the same focused view/workspace context directly.

## Scope

- Extend analytics CSV export snapshot rows to include:
  - focused analytics link (`focusAnalyticsHref`)
  - focused workspace label (`focusWorkspaceLabel`)
  - focused workspace link (`focusWorkspaceHref`)
- Ensure links preserve focus context for follow-up actions and handoff.
- Add regression guard and roadmap/work-item updates.

## Acceptance Criteria

1. CSV snapshot includes focus analytics href and focused workspace label/href rows.
2. `focusWorkspaceHref` carries analytics source context query.
3. Export behavior remains unchanged for existing KPI rows.
4. Regression test and roadmap/work-item links are updated.

## Notes

- Reporting UX enhancement only.
- No API contract/schema changes.
