# WI-0811 Admin Notices Initial Auto-Load + Read-Risk Quick Filter

## Summary
- `/admin/notices` workspace now auto-loads notice data once session context is ready (organization context or bearer token).
- Added quick filter actions for notice list triage:
  - `All` notices
  - `Delivery risk notices (0 reads)` only
- Read-risk quick filter works with existing list search without extra API calls.

## Scope
- UI: `src/components/notices/AdminNoticeWorkspace.tsx`
- UI: `src/components/notices/AdminNoticeWorkspaceView.tsx`
- Regression guard: `scripts/tests/e2e-wi0811-admin-notices-initial-auto-load-read-risk-quick-filter.test.ts`

## Acceptance
1. Admin notices page loads list data automatically on initial entry when session context is available.
2. Read-risk quick filter narrows list to published notices with zero reads.
3. Existing manual refresh and notice compose/publish/delete behaviors remain intact.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0811-admin-notices-initial-auto-load-read-risk-quick-filter.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0806-admin-notices-status-action-visibility.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0754-notices-audit-persistence-notification-link.test.ts`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`

## Notes
- This WI keeps admin notice controls in the existing route and improves first-load UX/triage speed without adding new ops-only flow.
