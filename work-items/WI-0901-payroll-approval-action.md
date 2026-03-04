# WI-0901 Payroll Approval Action in Approval Executions

## Summary
- Added a `PAYROLL` case to `resolveExecutionActionPath()` in the approval-executions page.
- `PAYROLL` approval now calls `POST /api/payroll/runs/{runId}/confirm`.
- Enabled `PAYROLL` items in queue `canApprove` so the Approve button is shown for pending payroll executions.
- Left rejection behavior unchanged (`LEAVE` only).

## Scope
- `src/app/admin/approval-executions/page.tsx`
- `src/app/admin/approval-executions/page-sections-queue.tsx`

## Acceptance
1. In `/admin/approval-executions`, a `PENDING` `PAYROLL` execution shows the Approve action.
2. Clicking Approve on a `PAYROLL` execution calls `POST /api/payroll/runs/{runId}/confirm` where `{runId} = execution.targetEntityId`.
3. Existing approval behavior for `LEAVE` and `ATTENDANCE` remains unchanged.
4. Existing rejection behavior remains unchanged (`LEAVE` only).

## Validation
- `npm.cmd run typecheck`
- `npm.cmd run lint`
