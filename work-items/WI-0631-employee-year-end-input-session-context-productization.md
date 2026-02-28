# WI-0631: Employee year-end input session-context productization

## Background

`/employee/year-end-input` still exposed manual runtime context fields
(`organizationId`, `employeeId`, access token), which kept a dev-console pattern on employee self-service.

## Scope

- Remove editable org/employee/token inputs from year-end input console.
- Derive context from Supabase session (`organizationId`, actor id, bearer token).
- Show session context as read-only metadata.
- Gate API logs behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`.

## Out of Scope

- year-end simulation domain logic changes
- API contract changes

## Acceptance Criteria

1. Console no longer requires manual org/employee/token inputs.
2. Session organization/employee is visible as read-only metadata.
3. API logs are visible only in devtools mode.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0631-employee-year-end-input-session-context-productization.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
