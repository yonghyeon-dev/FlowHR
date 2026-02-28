# WI-0665 Admin Dashboard Priority Focus Cards UX

## Summary
- added priority focus-card UX on `/admin` so operators can jump to highest-risk queues first.
- introduced `src/app/admin/page-focus-cards.ts` to centralize:
  - focus-card model construction from dashboard summary
  - severity classification (`critical/watch/stable`)
  - severity summary aggregation for quick status line
- updated `src/app/admin/page.tsx` to render:
  - priority queue section
  - severity summary (critical/watch/stable)
  - quick-action links with severity-aware emphasis
- preserved existing dedicated workspace navigation pattern.
- added WI-0665 regression guard for focus-card wiring and line budget.

## Scope
- admin dashboard UX improvement only
- no API/schema/contract changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0665-admin-dashboard-priority-focus-cards-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0618-admin-dashboard-productization-and-session-context.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0636-admin-dashboard-korean-copy-normalization.test.ts`
- `npm.cmd run typecheck`
