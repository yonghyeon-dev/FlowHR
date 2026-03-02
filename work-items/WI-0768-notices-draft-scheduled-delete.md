# WI-0768 Notices Draft/Scheduled Delete

## Summary
- added draft/scheduled notice delete capability in admin notices core journey.
- introduced `DELETE /api/notices/{noticeId}` for admin/manager notice deletion.
- enforced publish lock on deletes:
  - published notices return `409 notice.delete.published_locked`.
- wired admin notices UI list actions to include delete for non-published notices.
- persisted delete audit trail with `notice.deleted` action payload.

## Scope
- core product notices workflow enhancement only
- no scheduler/ops/devtools expansion
- no phase-style layering

## Data Changes
- none (reuse existing Notice persistence model)

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0768-notices-draft-scheduled-delete.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0764-notices-draft-scheduled-edit.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0407-notices-core-journey-implementation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0499-admin-notices-list-search-and-visible-count.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
