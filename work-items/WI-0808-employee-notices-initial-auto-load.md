# WI-0808 Employee Notices Initial Auto Load

## Summary
- Improve `/employee/notices` product UX by loading published notices automatically once session context is available.
- Keep manual refresh action intact while removing first-load friction.

## Scope
- `src/components/notices/EmployeeNoticeBoard.tsx`
- `scripts/tests/e2e-wi0808-employee-notices-initial-auto-load.test.ts`
- `ROADMAP.md`

## Implementation Notes
- Added `autoLoadAttempted` state to ensure the initial auto-load runs once per mount/session context.
- Added `useEffect` gate:
  - skip when auto-load already attempted
  - skip when both session organization and bearer token are unavailable
  - trigger `loadNotices()` once when context becomes ready

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0808-employee-notices-initial-auto-load.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0807-employee-notices-quick-filters-and-summary-visibility.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0527-employee-notice-read-status-filter-and-line-budget.test.ts`

## Risks
- UI-only change; no API or contract modification.
- Manual refresh and mark-read actions remain unchanged.
