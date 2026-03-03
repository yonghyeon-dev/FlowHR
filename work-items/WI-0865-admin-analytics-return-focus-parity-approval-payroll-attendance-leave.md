# WI-0865 Admin Analytics Return Focus Parity (Approval/Payroll/Attendance/Leave)

## Summary
- Extended admin analytics workspace context links to preserve selected analytics focus (`analyticsFocus`) alongside queue metric (`focusMetric`).
- Added analytics-origin banners and "Back to analytics" return actions for:
  - `/admin/approval-executions`
  - `/admin/attendance-live`
  - `/admin/leave-calendar`
  - `/admin/payroll-close`
- Propagated analytics focus context into payroll risk panel priority/quick links.

## Scope
- `src/components/admin-kpi/AdminKpiDashboard.tsx`
- `src/components/admin-kpi/AdminPayrollRiskKpiPanel.tsx`
- `src/components/admin-kpi/admin-analytics-context.ts` (new)
- `src/app/admin/approval-executions/page.tsx`
- `src/components/admin-attendance-live/AdminAttendanceLiveDashboard.tsx`
- `src/components/leave-calendar/LeaveCalendarConsole.tsx`
- `src/components/payroll-close/PayrollClosePeriodConsole.tsx`
- `scripts/tests/e2e-wi0865-admin-analytics-return-focus-parity-approval-payroll-attendance-leave.test.ts` (new)
- `scripts/tests/e2e-wi0798-admin-analytics-payroll-year-end-risk-kpi-panel.test.ts` (updated)
- `scripts/tests/e2e-wi0803-admin-analytics-csv-focus-workspace-context.test.ts` (updated)

## Acceptance
1. Admin analytics links carry both source (`source=admin-analytics`) and selected focus context (`analyticsFocus`) to target workspaces.
2. Approval, attendance, leave, and payroll-close workspaces parse analytics focus context and expose an analytics return CTA.
3. Existing dashboard/admin source banners and queue-focused behavior remain available.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0798-admin-analytics-payroll-year-end-risk-kpi-panel.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0803-admin-analytics-csv-focus-workspace-context.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0865-admin-analytics-return-focus-parity-approval-payroll-attendance-leave.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
