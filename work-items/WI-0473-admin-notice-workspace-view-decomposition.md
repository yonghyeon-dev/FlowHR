# WI-0473: Admin Notice Workspace View Decomposition

## Summary
- Goal: reduce `/admin/notices` workspace bloat and keep orchestration logic separate from JSX rendering.
- Scope:
  - `src/components/notices/AdminNoticeWorkspace.tsx`
  - `src/components/notices/AdminNoticeWorkspaceView.tsx` (new)

## Delivery
- Added `src/components/notices/AdminNoticeWorkspaceView.tsx`
  - Moved full admin notices JSX surface (filters/compose/list/logs panels) into dedicated view component.
  - Preserved existing copy keys and action wiring (`refresh/create/publish`).
- Updated `src/components/notices/AdminNoticeWorkspace.tsx`
  - Retained API/runtime orchestration only.
  - Delegated render to `AdminNoticeWorkspaceView` via explicit props.
  - Reduced line count to <= 300.
- Added regression test:
  - `scripts/tests/e2e-wi0473-admin-notice-workspace-view-decomposition.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0407-notices-core-journey-implementation.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0434-employee-notices-search-and-unread-filter.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0473-admin-notice-workspace-view-decomposition.test.ts`
