# WI-0810 Employee Notices Scoped Mark-All Read

## Summary
- Improve `/employee/notices` mark-all behavior to respect active filters/search.
- When users filter the list, mark-all now targets only visible unread notices instead of global unread notices.

## Scope
- `src/components/notices/EmployeeNoticeBoard.tsx`
- `src/features/notices/schemas.ts`
- `src/app/api/notices/read-all/route.ts`
- `src/features/notices/store.ts`
- `scripts/tests/e2e-wi0810-employee-notices-scoped-mark-all-read.test.ts`
- `ROADMAP.md`

## Implementation Notes
- Added scoped mark-all candidate list in employee board:
  - `visibleUnreadNoticeIds`
  - `shouldScopeMarkAllRead`
- Extended `/api/notices/read-all` payload schema with optional `noticeIds`.
- Route now forwards optional `noticeIds` to store layer.
- Store read-all flow now applies optional target notice-id allowlist before upserting read receipts.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0810-employee-notices-scoped-mark-all-read.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0809-employee-notices-admin-link-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0808-employee-notices-initial-auto-load.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0527-employee-notice-read-status-filter-and-line-budget.test.ts`

## Risks
- Backward compatible: if `noticeIds` is absent, behavior remains global mark-all.
- No contract version bump required because payload extension is optional and non-breaking.
