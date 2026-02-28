# WI-0619: Admin scheduling session-context adoption and devtools-log gate

## Background

`/admin/scheduling` exposed manual runtime context fields (`organizationId`, `actorId`, access token)
and always rendered request logs, which kept the screen in a dev-console pattern.

## Scope

- Remove editable org/actor/token inputs from admin scheduling workspace.
- Read organization/actor/token from Supabase session context.
- Keep API-log panel visible only when devtools flag is enabled.
- Preserve existing scheduling CRUD and incident action flows.

## Out of Scope

- scheduling domain/service logic changes
- new API endpoints

## Acceptance Criteria

1. `/admin/scheduling` no longer requires manual context input fields.
2. Session context is shown as read-only metadata in filters panel.
3. Request logs are hidden in product mode and shown only in devtools mode.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0619-admin-scheduling-session-context-and-devtools-log-gate.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
