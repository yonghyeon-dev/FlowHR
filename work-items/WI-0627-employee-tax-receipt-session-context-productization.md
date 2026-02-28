# WI-0627: Employee tax-receipt pages session-context productization

## Background

`/employee/withholding-receipt` and `/employee/payslip-receipts` still exposed manual runtime context inputs
(`organizationId`, `employeeId`, access token), which kept a dev-console pattern on core employee pages.

## Scope

- Remove editable org/employee/token inputs from both pages.
- Derive context from Supabase session (`organizationId`, actor id, bearer token).
- Show session context as read-only metadata.
- Gate request logs behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`.

## Out of Scope

- payroll domain/service logic changes
- API contract changes

## Acceptance Criteria

1. Both pages no longer require manual org/employee/token inputs.
2. Session organization/employee is visible as read-only metadata.
3. Request logs are visible only in devtools mode.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0627-employee-tax-receipt-session-context-productization.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
