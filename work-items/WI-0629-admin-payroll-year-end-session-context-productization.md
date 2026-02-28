# WI-0629: Admin payroll year-end session-context productization

## Background

`/admin/payroll-year-end` and `/admin/payroll-year-end/preflight` still exposed manual runtime context fields
(`organizationId`, `actorId`, access token), which kept a dev-console pattern in core payroll workflows.

## Scope

- Remove editable org/actor/token inputs from both pages.
- Derive context from Supabase session (`organizationId`, actor id, bearer token).
- Show session context as read-only metadata.
- Gate API logs behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`.

## Out of Scope

- year-end settlement/reconciliation domain logic changes
- API contract changes

## Acceptance Criteria

1. Both pages no longer require manual org/actor/token inputs.
2. Session organization/actor is visible as read-only metadata.
3. API logs are visible only in devtools mode.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0629-admin-payroll-year-end-session-context-productization.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
