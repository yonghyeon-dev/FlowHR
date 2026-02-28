# WI-0628: Admin payroll close/delivery session-context productization

## Background

`/admin/payroll-close` and `/admin/payroll-payslip-delivery` still required manual runtime context fields
(`organizationId`, `actorId`, access token), which left a dev-console interaction model on core admin payroll pages.

## Scope

- Remove editable org/actor/token inputs from both pages.
- Derive context from Supabase session (`organizationId`, actor id, bearer token).
- Show session context as read-only metadata.
- Gate API request logs behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`.

## Out of Scope

- payroll service domain logic changes
- API contract changes

## Acceptance Criteria

1. Both pages no longer require manual org/actor/token inputs.
2. Session organization/actor is visible as read-only metadata.
3. API logs are visible only in devtools mode.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0628-admin-payroll-close-delivery-session-context-productization.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
