# WI-0630: Admin payroll year-end filing session-context productization

## Background

`/admin/payroll-year-end-filing` still required manual runtime context fields
(`organizationId`, `actorId`, access token), which kept a dev-console pattern in the core filing workflow.

## Scope

- Remove editable org/actor/token inputs from filing console.
- Derive context from Supabase session (`organizationId`, actor id, bearer token).
- Show session context as read-only metadata.
- Gate API logs behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`.

## Out of Scope

- filing domain logic changes
- API contract changes

## Acceptance Criteria

1. Filing console no longer requires manual org/actor/token inputs.
2. Session organization/actor is visible as read-only metadata.
3. API logs are visible only in devtools mode.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0630-admin-payroll-year-end-filing-session-context-productization.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
