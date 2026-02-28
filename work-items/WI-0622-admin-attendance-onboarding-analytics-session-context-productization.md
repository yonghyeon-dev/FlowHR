# WI-0622: Admin attendance/onboarding/analytics session-context productization

## Background

`/admin/attendance-live`, `/admin/onboarding`, `/admin/analytics` still displayed manual
runtime fields (`organizationId`, `adminActorId`, access token), resulting in dev-console UX
instead of product workspace behavior.

## Scope

- Remove editable org/actor/token fields from the three admin workspaces.
- Derive context from Supabase session.
- Render session context as read-only metadata.
- Show logs only when devtools flag is enabled for attendance-live and analytics.

## Out of Scope

- domain-specific KPI/attendance/onboarding logic changes
- new endpoints or scheduler/ops automation

## Acceptance Criteria

1. Three admin screens no longer require manual org/actor/token fields.
2. Session metadata is shown read-only.
3. Logs are hidden in product mode and shown only in devtools mode.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0622-admin-workspaces-session-context-productization.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
