# WI-0976: admin/page.tsx size cap compliance

## Background and Problem

`src/app/admin/page.tsx` exceeded the 500-line policy limit.
Approval quick-action state and command logic were embedded in the page and inflated file size.

## Scope

### In Scope

- Extract approval quick-action logic to `src/app/admin/page-approval-actions.ts`.
- Keep dashboard quick-approval behavior unchanged.
- Reduce `src/app/admin/page.tsx` to 500 lines or less.
- Add static regression coverage for page size and extraction wiring.

### Out of Scope

- Dashboard UX redesign.
- API/schema/migration changes.

## Test Plan

- `node --experimental-strip-types scripts/tests/e2e-wi0976-admin-page-size-reduce.test.ts`
- `npm run typecheck`

## ADR

- Not required: bounded maintainability refactor without architecture changes.
