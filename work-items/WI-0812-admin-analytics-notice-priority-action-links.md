# WI-0812 Admin Analytics Notice Priority Action Links

## Summary
- Added notice follow-up priority actions to `/admin/analytics` notice KPI panel.
- Notice KPI panel now provides:
  - top-priority action reason
  - direct CTA to notice follow-up queue
  - quick links to notice workspace and no-read queue
- `/admin/notices` now consumes query context (`status`, `audience`, `q`, `risk`) so analytics deep links apply filters immediately.

## Scope
- `src/components/admin-kpi/AdminNoticesKpiPanel.tsx`
- `src/components/admin-kpi/copy.ts`
- `src/components/notices/AdminNoticeWorkspace.tsx`
- `scripts/tests/e2e-wi0812-admin-analytics-notice-priority-action-links.test.ts`

## Acceptance
1. Analytics notice panel shows priority action with reason and direct CTA.
2. Quick action links route to `/admin/notices` and filtered no-read queue.
3. Admin notice workspace applies incoming query filters on initial load and route query changes.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0812-admin-analytics-notice-priority-action-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0811-admin-notices-initial-auto-load-read-risk-quick-filter.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0769-admin-analytics-notices-read-kpi-panel.test.ts`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`

## Notes
- This WI improves actionability in analytics without introducing new ops-only routes.
