# WI-0764 Notices Draft/Scheduled Edit

## Summary
- added draft/scheduled notice edit capability in admin core journey.
- introduced `PATCH /api/notices/{noticeId}` for admin/manager notice updates.
- enforced publish lock on updates:
  - published notices return `409 notice.update.published_locked`.
- wired admin notices UI to support edit mode:
  - select draft/scheduled notice to edit
  - update and cancel-edit actions in compose panel
  - list-level edit action for non-published notices

## Scope
- core product notices workflow enhancement only
- no scheduler/ops/devtools expansion
- no phase-style layering

## Data Changes
- none (reuse existing Notice persistence model)

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0764-notices-draft-scheduled-edit.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0407-notices-core-journey-implementation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0473-admin-notice-workspace-view-decomposition.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0499-admin-notices-list-search-and-visible-count.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
