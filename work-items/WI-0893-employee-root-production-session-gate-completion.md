# WI-0893 Employee Root Production Session Gate Completion

## Summary
- Applied the product-mode login-session gate to the `/employee` root dashboard mutation runtime.
- Restricted employee dashboard `x-actor-*` fallback headers to `showDevTools || !isProductionRuntime`.
- Blocked root dashboard mutation/refresh actions in production when bearer session is missing and surfaced `/login` guidance.

## Scope
- `src/app/employee/page.tsx`
- `src/app/employee/page-api-helpers.ts`
- `src/app/employee/page-mutation-runtime.ts`
- `src/components/employee-dashboard/EmployeeDashboardChrome.tsx`
- `src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx`
- `src/components/employee-dashboard/EmployeeAttendanceLeavePanels.tsx`
- `src/components/employee-dashboard/EmployeeAttendanceLeaveFormsPanel.tsx`
- `scripts/tests/e2e-wi0893-employee-root-production-session-gate-completion.test.ts` (new)

## Acceptance
1. In production runtime with devtools disabled and no bearer session, root employee dashboard mutation calls are blocked and `/login` guidance is shown.
2. Employee root API helper sends `x-actor-*` headers only when devtools mode is enabled or runtime is non-production.
3. Root dashboard mutation buttons (attendance/leave actions + snapshot refresh) are disabled when production login session is required.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0869-employee-session-autoload-snapshot.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0893-employee-root-production-session-gate-completion.test.ts`
- `npm.cmd run build`
