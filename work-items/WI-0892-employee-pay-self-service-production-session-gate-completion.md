# WI-0892 Employee Pay Self-Service Production Session Gate Completion

## Summary
- Applied a consistent product-mode login-session gate to employee payroll self-service pages:
  - `/employee/payslips`
  - `/employee/year-end-input`
- Restricted `x-actor-*` fallback headers to `showDevTools || !isProductionRuntime`.
- Added product-mode `/login` guidance and blocked fetch/download actions when a production login session is required.

## Scope
- `src/app/employee/payslips/page.tsx`
- `src/app/employee/payslips/use-payslip-api.ts`
- `src/app/employee/payslips/page-view.tsx`
- `src/app/employee/payslips/page-view-types.ts`
- `src/app/employee/payslips/page-view-filter-panel.tsx`
- `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx`
- `scripts/tests/e2e-wi0892-employee-pay-self-service-production-session-gate-completion.test.ts` (new)

## Acceptance
1. In production runtime with devtools disabled and no bearer session, payslip refresh/download and year-end finalized settlement load actions are blocked with `/login` guidance.
2. Header fallback (`x-actor-role`, `x-actor-id`, `x-actor-organization-id`) is allowed only when `showDevTools` is enabled or runtime is non-production.
3. Existing employee self-service behavior remains intact for non-production and devtools-enabled diagnostics.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0625-employee-payslips-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0631-employee-year-end-input-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0892-employee-pay-self-service-production-session-gate-completion.test.ts`
- `npm.cmd run build`
