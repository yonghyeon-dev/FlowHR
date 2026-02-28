# WI-0666 Admin Dashboard Priority Copy Normalization Guard

## Summary
- extracted priority-focus section copy from `/admin` page into:
  - `src/app/admin/page-focus-copy.ts`
- centralized locale-aware labels for:
  - priority section title/description/summary
  - focus-card queue labels
  - severity labels (critical/watch/stable)
- switched `/admin` priority section rendering to consume copy helper APIs.
- added Korean copy normalization guard test to block mojibake regression in the new copy module.

## Scope
- admin dashboard copy/runtime helper wiring only
- no API/schema/contract changes
- no workflow behavior changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0666-admin-dashboard-priority-copy-normalization-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0665-admin-dashboard-priority-focus-cards-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0636-admin-dashboard-korean-copy-normalization.test.ts`
- `npm.cmd run typecheck`
