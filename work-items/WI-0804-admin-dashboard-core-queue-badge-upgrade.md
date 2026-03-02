# WI-0804 Admin Dashboard Core Queue Badge Upgrade

## Background

- `/admin` already exposes priority focus cards, but core waiting queues were still mixed with generic KPIs.
- Admin operators need queue-first visibility for approvals, payroll, and contracts at dashboard entry.

## Scope

- Expand dashboard summary aggregation with queue-centric counters:
  - approvals: pending, stalled(24h+)
  - payroll: previewed, confirmed-but-undistributed
  - contracts: decision queue, SLA overdue
- Add "core queue badges" section showing total/critical/watch counts and direct queue links.
- Keep dashboard as summary-only surface and route detailed work to dedicated workspaces.

## Acceptance Criteria

1. `/admin` renders queue badges for approvals, payroll, and contracts.
2. Each badge shows total count plus critical/watch decomposition.
3. Each badge includes quick link to the matching workspace.
4. Regression test and roadmap/work-item links are updated.

## Notes

- Dashboard UX enhancement only.
- No API contract/schema changes.
