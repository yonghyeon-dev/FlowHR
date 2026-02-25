# WI-0421: Notices Admin Read Coverage Visibility

## Summary
- Goal: make notice delivery quality visible to admins using read-receipt coverage.
- Change:
  - `GET /api/notices` now returns org-wide read receipts for admin/manager actors.
  - Admin notice workspace parses read receipts and renders read-count per notice.
  - Added locale copy for read-count label.
- Outcome:
  - Admin can monitor read coverage directly from notice list without separate ops tooling.

## Scope
- `src/app/api/notices/route.ts`
- `src/components/notices/copy.ts`
- `src/components/notices/AdminNoticeWorkspace.tsx`
- `scripts/tests/e2e-wi0421-notices-admin-read-coverage-visibility.test.ts`
- `work-items/WI-0421-notices-admin-read-coverage-visibility.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0418-notices-read-receipt-core-journey.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0421-notices-admin-read-coverage-visibility.test.ts`

