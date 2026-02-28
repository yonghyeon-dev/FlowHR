# WI-0625: Employee payslips session-context productization

## Background

`/employee/payslips` still exposed manual organization/employee inputs and token controls on
the main product filter panel, which conflicted with session-driven self-service UX.

## Scope

- Remove editable organization/employee inputs from payslip filter panel.
- Remove direct access-token input from payslip screen.
- Derive organization/employee context from Supabase session.
- Keep period/search/compare workflows unchanged.

## Out of Scope

- payroll calculation logic changes
- payslip API schema changes

## Acceptance Criteria

1. Payslip page no longer requires manual organization/employee/token inputs.
2. Session context is visible as read-only metadata.
3. Existing payslip list/detail/search/compare flows remain operational.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0625-employee-payslips-session-context-productization.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
