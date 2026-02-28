# WI-0643 Admin Approval Executions Product UX

## Summary
- productized `/admin/approval-executions` so it behaves like a user-facing admin workspace instead of a developer console
- updated execution quick-jump routing to dedicated workspaces:
  - PAYROLL -> `/admin/payroll-year-end`
  - LEAVE -> `/admin/leave-accrual`
  - ATTENDANCE -> `/admin/attendance-live`
- updated quick-jump labels from generic section wording to workspace wording (`Payroll/Leave/Attendance workspace`)
- reframed the primary filter panel title from `Context and filters` to `Work conditions`
- moved advanced execution controls behind a collapsible `Advanced options` block:
  - target entity type/id
  - execution/history limits
  - escalation channel
- gated request logs panel behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`; when disabled, show only product-facing related workspace shortcuts

## Scope
- admin approvals UX refinement only
- no scheduler/ops automation expansion
- no new API contract changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0626-admin-approval-pages-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0643-admin-approval-executions-product-ux.test.ts`
