# WI-0377: Admin page action helper extraction

## Summary
- Extracted admin dashboard action handlers into `src/app/admin/page-action-helpers.ts`.
- Moved employee/invite/schedule/organization/leave-policy/attendance-aggregate action parsing logic out of `src/app/admin/page.tsx`.
- Added shared validation failure log builder for admin-side guard errors and rewired page wrappers to delegate to helper functions.

## Scope
- `src/app/admin/page.tsx`
- `src/app/admin/page-action-helpers.ts`
- `scripts/tests/e2e-wi0377-admin-page-action-helper-extraction.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0377-admin-page-action-helper-extraction.test.ts`
- `npm.cmd run -s typecheck`
