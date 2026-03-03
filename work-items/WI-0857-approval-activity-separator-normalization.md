# WI-0857 Approval Activity Separator Normalization

## Summary
- Replaced corrupted hardcoded separators in admin approval queue recent-activity rows.
- Reused `copy.summaryConnector` so ko/en runtime uses the same normalized separator token.
- Removed mojibake-like literal text from the UI rendering path.

## Scope
- `src/components/admin-approval/ApprovalQueueActivitySection.tsx`
- `scripts/tests/e2e-wi0857-approval-activity-separator-normalization.test.ts` (new)

## Acceptance
1. Approval activity row uses `copy.summaryConnector` between action/item/status/time values.
2. Corrupted literal separator text is no longer present in the component source.
3. Existing activity row structure and status badges remain unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0857-approval-activity-separator-normalization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0856-admin-approval-dashboard-open-link-stalled-filter-fix.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
