# WI-0626: Admin approval pages session-context productization

## Background

Approval admin pages (`/admin/approval-executions`, `/admin/approval-history`,
`/admin/approval-policy`, `/admin/approval-templates`) still required manual
organization/admin/token input, keeping a dev-console pattern.

## Scope

- Remove editable organization/admin/token fields from the four approval pages.
- Derive context from Supabase session for bearer/header fallback.
- Show session organization/admin context as read-only metadata in filter/context panels.

## Out of Scope

- approval engine state machine changes
- approval domain API changes

## Acceptance Criteria

1. Four approval pages no longer require manual org/admin/token input fields.
2. Session context is displayed read-only.
3. Existing approval list/history/policy/template actions keep working.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0626-admin-approval-pages-session-context-productization.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
