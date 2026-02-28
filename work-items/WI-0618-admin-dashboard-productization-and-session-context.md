# WI-0618: Admin dashboard productization and session-context guard

## Background

`/admin` had drifted into a monolithic dev-console style surface:

- onboarding/forms/queue/payroll controls were all rendered in one screen
- hash-section navigation (`/admin#...`) represented internal panel structure
- manual context inputs (`organizationId`, `actorId`, token override) were exposed in product surfaces

This WI re-centers the admin journey around product UX.

## Scope

- Replace `/admin` with a summary dashboard:
  - KPI strip (pending attendance/leave/payroll preview and employee count)
  - dedicated workspace shortcuts (`/admin/people`, `/admin/scheduling`, `/admin/payroll-year-end`, etc.)
- Remove hash-section navigation from `src/app/admin/layout.tsx` and link to dedicated routes.
- Move filing ops deep links out of primary admin nav; expose them only under devtools footer links.
- Remove manual context input UI from `/admin/people` filter panel:
  - no editable `organizationId`, `adminActorId`, or access-token override fields
  - render session context as read-only summary instead

## Out of Scope

- backend auth contract changes
- new ops tooling
- scheduler/automation expansion

## Acceptance Criteria

1. `/admin` no longer renders monolithic onboarding/ops form panels.
2. Admin navigation does not use `/admin#...` links for core workflows.
3. `/admin/people` does not expose editable org/actor/token fields.
4. Dashboard and people workspace continue to build and pass typecheck/lint.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0618-admin-dashboard-productization-and-session-context.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
