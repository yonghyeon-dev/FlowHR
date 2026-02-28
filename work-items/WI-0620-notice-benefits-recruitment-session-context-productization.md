# WI-0620: Notices/Benefits/Recruitment session-context productization

## Background

`/admin/notices`, `/employee/notices`, `/admin/benefits`, `/employee/benefits`,
`/admin/recruitment`, `/employee/recruitment` still exposed manual runtime fields
(`organizationId`, `actorId`/`employeeId`, access token), which kept these pages in a dev-console UX.

## Scope

- Remove editable org/actor/token inputs from the six notice/benefits/recruitment pages.
- Derive runtime context from Supabase session (`organizationId`, actor id, bearer token).
- Render session context as read-only metadata in each filter/session panel.
- Keep request-log panels on admin notices/benefits behind devtools flag only.

## Out of Scope

- domain API contract changes
- scheduler/ops automation additions
- additional preset/import/export UX layers

## Acceptance Criteria

1. The six pages no longer require manual org/actor/token input fields.
2. Session context is displayed read-only on each page.
3. Admin notice/benefit request logs are hidden unless `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` is enabled.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0620-notice-benefits-recruitment-session-context-productization.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
