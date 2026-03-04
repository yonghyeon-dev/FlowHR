# WI-0902 Attendance Reject Endpoint

## Summary
- Added/standardized `POST /api/attendance/records/{recordId}/reject` to follow the leave reject route pattern (`request.json()` + schema validation + service call).
- Enforced required rejection reason for attendance reject payloads.
- Updated attendance reject service to require and persist a non-empty normalized reason.
- Expanded approval-executions reject action to include `ATTENDANCE` (`canReject` now supports `LEAVE` + `ATTENDANCE`).
- Updated approval-executions reject UI copy/path handling so attendance reject uses the correct API and modal text.

## Scope
- `src/app/api/attendance/records/[recordId]/reject/route.ts`
- `src/features/attendance/schemas.ts`
- `src/features/attendance/service.ts`
- `src/app/admin/approval-executions/page.tsx`
- `src/app/admin/approval-executions/page-sections-queue.tsx`
- `src/components/admin-approval/ApprovalQueuePanel.tsx`
- `src/app/ops/admin-console/page.tsx`
- `scripts/tests/e2e-wi0001.test.ts`
- `scripts/tests/e2e-wi0001-prisma.test.ts`

## Acceptance
1. `POST /api/attendance/records/{recordId}/reject` validates JSON body with required `reason` and returns `400 invalid payload` when missing/invalid.
2. Pending `ATTENDANCE` executions in `/admin/approval-executions` show Reject action.
3. Rejecting `ATTENDANCE` from approval-executions calls `POST /api/attendance/records/{recordId}/reject` with `{ reason }`.
4. Rejection reason is required in UI and service layer.

## Validation
- `npm.cmd run typecheck`
- `npm.cmd run lint`
