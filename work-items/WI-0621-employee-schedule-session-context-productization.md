# WI-0621: Employee schedule session-context productization

## Background

`/employee/schedule` exposed manual runtime fields (`organizationId`, `employeeId`, access token),
which kept a dev-console pattern on a core employee self-service screen.

## Scope

- Remove editable org/employee/token inputs from employee schedule board.
- Derive context from Supabase session (`organizationId`, actor id, bearer token).
- Show session context as read-only metadata.
- Gate API logs behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`.

## Out of Scope

- scheduling domain/service logic changes
- API contract changes

## Acceptance Criteria

1. `/employee/schedule` no longer requires manual org/employee/token inputs.
2. Session organization/employee is visible as read-only metadata.
3. Logs panel is shown only in devtools mode.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0621-employee-schedule-session-context-productization.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
