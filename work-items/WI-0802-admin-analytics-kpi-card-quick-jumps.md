# WI-0802 Admin Analytics KPI Card Quick Jumps

## Background

- WI-0800 introduced focus metric deeplinks and workspace shortcut panel.
- WI-0801 added focused KPI summary for selected metric.
- Admin users still need one-click workspace transitions directly from each KPI card.

## Scope

- Add KPI-card-level quick jump actions in `/admin/analytics`.
- Map each KPI card to its owner workspace and append analytics source context:
  - `source=admin-analytics`
  - `focusMetric=<metric-key>`
- Keep quick jump actions analytics-only so `/admin` dashboard view remains compact.
- Add regression guard for quick-link wiring and roadmap/work-item references.

## Acceptance Criteria

1. In analytics mode, each KPI card exposes a quick jump action to the matching workspace.
2. Quick jump links include analytics source context and focus metric key.
3. Non-analytics admin dashboard mode does not render card quick jump actions.
4. Regression test and roadmap/work-item links are updated.

## Notes

- UX enhancement only.
- No API contract/schema changes.
